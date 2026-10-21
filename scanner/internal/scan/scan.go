// Package scan runs all probes for a list of targets and assembles results.
package scan

import (
	"context"
	"crypto/tls"
	"runtime"
	"sort"
	"sync"
	"time"

	"github.com/qday-india/qday-india/scanner/internal/grade"
	"github.com/qday-india/qday-india/scanner/internal/model"
	"github.com/qday-india/qday-india/scanner/internal/probe"
	"github.com/qday-india/qday-india/scanner/internal/targets"
)

const Version = "1.0.0"

// Options control a scan run.
type Options struct {
	Probe       *probe.Config
	Concurrency int           // hosts in parallel (spec: 8)
	Gap         time.Duration // pause between probes on the same host (spec: 300ms)
	Progress    func(done, total int, r model.SiteResult)
}

// Run scans every target (max Concurrency hosts at a time, probes on one host
// strictly sequential) and returns results sorted by host.
func Run(ctx context.Context, ts []targets.Target, o Options) []model.SiteResult {
	if o.Concurrency <= 0 {
		o.Concurrency = 8
	}
	results := make([]model.SiteResult, len(ts))
	jobs := make(chan int)
	var wg sync.WaitGroup
	var mu sync.Mutex
	done := 0
	for w := 0; w < o.Concurrency; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := range jobs {
				results[i] = Host(ctx, ts[i], o)
				if o.Progress != nil {
					mu.Lock()
					done++
					o.Progress(done, len(ts), results[i])
					mu.Unlock()
				}
			}
		}()
	}
	for i := range ts {
		jobs <- i
	}
	close(jobs)
	wg.Wait()
	retryTimeouts(ctx, ts, results, o)
	sort.Slice(results, func(i, j int) bool { return results[i].Host < results[j].Host })
	return results
}

// retryTimeouts gives hosts that timed out a second, slower pass after the main
// scan: some government and bank sites are slow or rate-limit bursts, and a
// timeout says nothing about their TLS configuration.
func retryTimeouts(ctx context.Context, ts []targets.Target, results []model.SiteResult, o Options) {
	if o.Probe == nil || ctx.Err() != nil {
		return
	}
	slow := *o.Probe
	slow.Timeout = 2 * o.Probe.Timeout
	so := o
	so.Probe = &slow
	so.Gap = 2 * o.Gap
	for i := range results {
		if results[i].Error == nil || results[i].Error.Code != model.ErrTimeout || ctx.Err() != nil {
			continue
		}
		if r := Host(ctx, ts[i], so); r.Reachable {
			results[i] = r
		}
	}
}

// Host runs P1–P5 and H1 against one target.
func Host(ctx context.Context, t targets.Target, o Options) model.SiteResult {
	pc := o.Probe
	res := model.SiteResult{
		Host: t.Host, Org: t.Org, Sector: t.Sector, Subsector: t.Subsector,
		Verified: t.Verified, ShelfLifeYears: grade.ShelfLife(t.Sector, t.ShelfLifeYears),
		HygieneFlags: []string{},
	}
	pause := func() {
		select {
		case <-ctx.Done():
		case <-time.After(o.Gap):
		}
	}

	p1 := pc.Run(ctx, probe.P1Default, t.Host)
	compat := false
	if !p1.OK && p1.Err != nil && p1.Err.Code == model.ErrTLS {
		pause()
		if c := pc.Run(ctx, probe.P1Compat, t.Host); c.OK {
			p1, compat = c, true
		}
	}
	if !p1.OK && p1.Err != nil && p1.Err.Code != model.ErrTLS {
		// DNS failure, timeout or refusal: the host is not reachable on 443.
		res.Error = &model.ErrorInfo{Code: p1.Err.Code, Detail: p1.Err.Detail}
		return res
	}
	pause()
	p2 := pc.Run(ctx, probe.P2PQOnly, t.Host)
	pause()
	p3 := pc.Run(ctx, probe.P3PQAlt, t.Host)
	pause()
	p4 := pc.Run(ctx, probe.P4TLS13, t.Host)
	pause()
	p5 := pc.Run(ctx, probe.P5Legacy, t.Host)

	var head *model.HTTPInfo
	var headErr *probe.Error
	if p1.OK || p5.OK {
		pause()
		head, headErr = pc.Head(ctx, t.Host)
	}
	res = Assemble(res, p1, p2, p3, p4, p5, head, headErr, pc.Now())
	if compat && res.Probes != nil {
		res.Probes.Default.Detail += " (compatibility handshake: the server rejected the default ClientHello)"
	}
	return res
}

// Assemble turns raw probe outcomes into a SiteResult. It is pure so that it
// can be tested with recorded handshakes.
func Assemble(res model.SiteResult, p1, p2, p3, p4, p5 probe.Handshake, head *model.HTTPInfo, headErr *probe.Error, now time.Time) model.SiteResult {
	res.Probes = &model.ProbeSummary{
		Default: outcome(p1, "group"), PQOnly: outcome(p2, ""), PQAlt: outcome(p3, ""),
		TLS13: outcome(p4, ""), Legacy: outcome(p5, "version"),
	}
	if headErr != nil {
		res.Probes.Head = model.ProbeOutcome{Detail: headErr.Code}
	} else if head != nil {
		res.Probes.Head = model.ProbeOutcome{OK: true}
	}
	if res.HygieneFlags == nil {
		res.HygieneFlags = []string{}
	}

	// P1 is the reference handshake. If it failed (e.g. a dropped connection)
	// P4 also used the default groups; P5 means the server only speaks TLS < 1.2.
	main := p1
	if !main.OK {
		main = p4
	}
	if !main.OK {
		main = p5
	}
	if !main.OK {
		code, detail := model.ErrTLS, "handshake failed"
		if p1.Err != nil {
			code, detail = p1.Err.Code, p1.Err.Detail
		}
		res.Error = &model.ErrorInfo{Code: code, Detail: detail}
		res.Grade = nil
		return res
	}
	res.Reachable = true

	defaultPQ := main.OK && probe.PQGroups[main.CurveID]
	pqAltSupported := p3.OK && probe.PQGroups[p3.CurveID]
	res.TLS = &model.TLSInfo{
		MaxVersion:    probe.VersionName(main.Version),
		DefaultGroup:  probe.GroupName(main.CurveID),
		LegacyEnabled: p5.OK,
		CipherSuite:   tls.CipherSuiteName(main.Cipher),
		ALPN:          main.ALPN,
		PQHybrid:      model.PQHybrid{X25519MLKEM768: p2.OK && p2.CurveID == tls.X25519MLKEM768},
	}
	// Report each alternative hybrid individually when P3 negotiated it.
	if p3.OK {
		yes := true
		switch p3.CurveID {
		case tls.SecP256r1MLKEM768:
			res.TLS.PQHybrid.SecP256r1MLKEM768 = &yes
		case tls.SecP384r1MLKEM1024:
			res.TLS.PQHybrid.SecP384r1MLKEM1024 = &yes
		}
	} else {
		no := false
		res.TLS.PQHybrid.SecP256r1MLKEM768, res.TLS.PQHybrid.SecP384r1MLKEM1024 = &no, &no
	}

	res.Cert = probe.CertInfo(main)
	res.HTTP = head

	g := grade.Grade(grade.Input{
		Reachable:  true,
		CertValid:  res.Cert != nil && res.Cert.Valid,
		MaxVersion: res.TLS.MaxVersion,
		DefaultPQ:  defaultPQ,
		PQOnly:     res.TLS.PQHybrid.X25519MLKEM768,
		PQAlt:      pqAltSupported,
		TLS13:      p4.OK || main.Version == tls.VersionTLS13,
		LegacyTLS:  p5.OK,
	})
	res.Grade = &g
	res.HygieneFlags = Hygiene(main, p5.OK, head, now)
	res.HNDLRisk = grade.HNDLRisk(g, res.Sector, res.ShelfLifeYears)
	return res
}

// Hygiene computes classical hygiene flags (§5.4); they never affect the grade.
func Hygiene(main probe.Handshake, legacy bool, head *model.HTTPInfo, now time.Time) []string {
	flags := []string{}
	if len(main.Chain) > 0 {
		leaf := main.Chain[0]
		if alg, bits, _ := probe.KeyInfo(leaf); alg == "RSA" && bits < 2048 {
			flags = append(flags, model.FlagRSAWeak)
		}
		for _, c := range main.Chain {
			// Self-signed roots' signatures are not checked by clients; ignore them.
			if probe.IsSHA1(c.SignatureAlgorithm.String()) && !(c.IsCA && c.Subject.String() == c.Issuer.String()) {
				flags = append(flags, model.FlagSHA1InChain)
				break
			}
		}
		if leaf.NotAfter.Sub(now) < 14*24*time.Hour {
			flags = append(flags, model.FlagCertExpiring)
		}
		if main.VerifyErr != nil {
			flags = append(flags, model.FlagCertInvalid)
		}
	}
	if head != nil && !head.HSTS {
		flags = append(flags, model.FlagNoHSTS)
	}
	if legacy {
		flags = append(flags, model.FlagLegacyTLS)
	}
	sort.Strings(flags)
	return flags
}

func outcome(h probe.Handshake, detail string) model.ProbeOutcome {
	if !h.OK {
		if h.Err != nil {
			return model.ProbeOutcome{Detail: h.Err.Code}
		}
		return model.ProbeOutcome{}
	}
	o := model.ProbeOutcome{OK: true}
	switch detail {
	case "group":
		o.Detail = probe.VersionName(h.Version) + " " + probe.GroupName(h.CurveID)
	case "version":
		o.Detail = probe.VersionName(h.Version)
	}
	return o
}

// NewFile wraps results in the output envelope.
func NewFile(results []model.SiteResult, at time.Time) model.ScanFile {
	return model.ScanFile{
		ScannedAt:      at.UTC().Format(time.RFC3339),
		ScannerVersion: Version,
		GoVersion:      runtime.Version(),
		Results:        results,
	}
}
