// Package probe performs the TLS handshakes P1–P5 and the HEAD request H1
// described in PROJECT_SPEC.md §5.1. Every probe is an ordinary handshake to
// host:443 with SNI = host; nothing beyond the handshake and one HEAD / is sent.
package probe

import (
	"context"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"syscall"
	"time"

	"github.com/qday-india/qday-india/scanner/internal/model"
	"github.com/qday-india/qday-india/scanner/internal/netguard"
)

// Config controls how probes connect. The zero value is not usable; use Default.
type Config struct {
	Timeout   time.Duration // per probe
	Retries   int           // extra attempts on network errors
	UserAgent string
	// RootCAs verifies the chain; nil means the system pool.
	RootCAs *x509.CertPool
	// Dial opens the TCP connection. Tests use it to point at local servers;
	// the on-demand workflow uses it to pin a validated public IP.
	Dial func(ctx context.Context, network, addr string) (net.Conn, error)
	// Port defaults to 443.
	Port string
	Now  func() time.Time
}

func Default(userAgent string) *Config {
	d := &net.Dialer{Timeout: 10 * time.Second}
	return &Config{
		Timeout:   10 * time.Second,
		Retries:   1,
		UserAgent: userAgent,
		Dial:      d.DialContext,
		Port:      "443",
		Now:       time.Now,
	}
}

// Error is a classified probe failure.
type Error struct {
	Code   string // model.Err*
	Detail string
}

func (e *Error) Error() string { return e.Code + ": " + e.Detail }

// Handshake is the outcome of one TLS probe.
type Handshake struct {
	OK        bool
	Version   uint16
	CurveID   tls.CurveID
	Cipher    uint16
	ALPN      string
	Chain     []*x509.Certificate
	VerifyErr error
	Err       *Error
}

// PQGroups are the hybrid post-quantum key-exchange groups we recognise.
var PQGroups = map[tls.CurveID]bool{
	tls.X25519MLKEM768: true, tls.SecP256r1MLKEM768: true, tls.SecP384r1MLKEM1024: true,
}

// Kind identifies a probe.
type Kind int

const (
	P1Default Kind = iota + 1
	P2PQOnly
	P3PQAlt
	P4TLS13
	P5Legacy
)

func (k Kind) String() string {
	return [...]string{"", "P1-default", "P2-pq-only", "P3-pq-alt", "P4-tls13", "P5-legacy"}[k]
}

// tlsConfig returns the client configuration for a probe. Verification is done
// manually after the handshake so that an invalid chain is recorded, not fatal.
func (c *Config) tlsConfig(k Kind, host string) *tls.Config {
	cfg := &tls.Config{
		ServerName:         host,
		InsecureSkipVerify: true, //nolint:gosec // chain is verified in verifyChain
		MinVersion:         tls.VersionTLS12,
	}
	switch k {
	case P1Default:
		cfg.NextProtos = []string{"h2", "http/1.1"}
	case P2PQOnly:
		cfg.MinVersion = tls.VersionTLS13
		cfg.CurvePreferences = []tls.CurveID{tls.X25519MLKEM768}
	case P3PQAlt:
		cfg.MinVersion = tls.VersionTLS13
		cfg.CurvePreferences = []tls.CurveID{tls.SecP256r1MLKEM768, tls.SecP384r1MLKEM1024}
	case P4TLS13:
		cfg.MinVersion, cfg.MaxVersion = tls.VersionTLS13, tls.VersionTLS13
	case P5Legacy:
		cfg.MinVersion, cfg.MaxVersion = tls.VersionTLS10, tls.VersionTLS11
		// Old servers only speak CBC/RSA-kex suites; offer everything in this probe only.
		var ids []uint16
		for _, s := range append(tls.CipherSuites(), tls.InsecureCipherSuites()...) {
			ids = append(ids, s.ID)
		}
		cfg.CipherSuites = ids
	}
	return cfg
}

// Run performs one probe, retrying once on network errors.
func (c *Config) Run(ctx context.Context, k Kind, host string) Handshake {
	var h Handshake
	for attempt := 0; attempt <= c.Retries; attempt++ {
		h = c.once(ctx, k, host)
		if h.OK || h.Err == nil || h.Err.Code == model.ErrDNS || (h.Err.Code == model.ErrTLS && !transient(h.Err.Detail)) {
			// TLS alerts are answers, not network errors; DNS failures don't
			// heal in a few hundred milliseconds.
			return h
		}
		if ctx.Err() != nil {
			return h
		}
		time.Sleep(500 * time.Millisecond)
	}
	return h
}

func (c *Config) once(parent context.Context, k Kind, host string) Handshake {
	ctx, cancel := context.WithTimeout(parent, c.Timeout)
	defer cancel()
	raw, err := c.Dial(ctx, "tcp", net.JoinHostPort(host, c.port()))
	if err != nil {
		return Handshake{Err: Classify(err)}
	}
	defer raw.Close()
	conn := tls.Client(raw, c.tlsConfig(k, host))
	if err := conn.HandshakeContext(ctx); err != nil {
		return Handshake{Err: Classify(err)}
	}
	st := conn.ConnectionState()
	h := Handshake{
		OK:      true,
		Version: st.Version,
		CurveID: st.CurveID,
		Cipher:  st.CipherSuite,
		ALPN:    st.NegotiatedProtocol,
		Chain:   st.PeerCertificates,
	}
	h.VerifyErr = c.verifyChain(host, st.PeerCertificates)
	return h
}

func (c *Config) port() string {
	if c.Port == "" {
		return "443"
	}
	return c.Port
}

func (c *Config) verifyChain(host string, chain []*x509.Certificate) error {
	if len(chain) == 0 {
		return errors.New("no certificate presented")
	}
	inter := x509.NewCertPool()
	for _, ic := range chain[1:] {
		inter.AddCert(ic)
	}
	_, err := chain[0].Verify(x509.VerifyOptions{
		Roots:         c.RootCAs,
		Intermediates: inter,
		DNSName:       host,
		CurrentTime:   c.Now(),
	})
	return err
}

// Classify maps a dial/handshake error to a reason code.
func Classify(err error) *Error {
	if err == nil {
		return nil
	}
	detail := err.Error()
	var dnsErr *net.DNSError
	var netErr net.Error
	switch {
	case errors.As(err, &dnsErr):
		return &Error{model.ErrDNS, detail}
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, os.ErrDeadlineExceeded),
		errors.As(err, &netErr) && netErr.Timeout():
		return &Error{model.ErrTimeout, detail}
	case errors.Is(err, netguard.ErrNotPublic):
		return &Error{model.ErrRefused, "refused to scan: " + detail}
	case errors.Is(err, syscall.ECONNREFUSED), strings.Contains(strings.ToLower(detail), "refused"):
		return &Error{model.ErrRefused, detail}
	default:
		return &Error{model.ErrTLS, detail}
	}
}

// transient reports whether a handshake error looks like a dropped connection
// (reset, EOF) rather than a TLS alert, so it is worth one retry.
func transient(detail string) bool {
	d := strings.ToLower(detail)
	for _, s := range []string{"reset", "forcibly closed", "eof", "broken pipe", "aborted"} {
		if strings.Contains(d, s) {
			return true
		}
	}
	return false
}

// VersionName converts a TLS version number to the contract's spelling.
func VersionName(v uint16) string {
	switch v {
	case tls.VersionTLS13:
		return "TLS1.3"
	case tls.VersionTLS12:
		return "TLS1.2"
	case tls.VersionTLS11:
		return "TLS1.1"
	case tls.VersionTLS10:
		return "TLS1.0"
	}
	return fmt.Sprintf("0x%04x", v)
}

// GroupName converts a negotiated group to a friendly name.
func GroupName(id tls.CurveID) string {
	switch id {
	case 0:
		return "RSA" // legacy RSA key transport, no ephemeral group
	case tls.CurveP256:
		return "P-256"
	case tls.CurveP384:
		return "P-384"
	case tls.CurveP521:
		return "P-521"
	}
	return id.String()
}

// CertInfo summarises the leaf certificate and chain.
func CertInfo(h Handshake) *model.CertInfo {
	if len(h.Chain) == 0 {
		return nil
	}
	leaf := h.Chain[0]
	ci := &model.CertInfo{
		SignatureAlgorithm:       leaf.SignatureAlgorithm.String(),
		Issuer:                   leaf.Issuer.String(),
		NotAfter:                 leaf.NotAfter.UTC().Format(time.RFC3339),
		ChainSignatureAlgorithms: []string{},
		Valid:                    h.VerifyErr == nil,
	}
	if h.VerifyErr != nil {
		ci.ValidationError = h.VerifyErr.Error()
	}
	ci.KeyAlgorithm, ci.KeySize, ci.Curve = KeyInfo(leaf)
	for _, ic := range h.Chain[1:] {
		ci.ChainSignatureAlgorithms = append(ci.ChainSignatureAlgorithms, ic.SignatureAlgorithm.String())
	}
	return ci
}

// KeyInfo returns the public key algorithm, size in bits and curve name.
func KeyInfo(c *x509.Certificate) (alg string, bits int, curve string) {
	switch k := c.PublicKey.(type) {
	case *rsa.PublicKey:
		return "RSA", k.N.BitLen(), ""
	case *ecdsa.PublicKey:
		p := k.Curve.Params()
		return "ECDSA", p.BitSize, p.Name
	case ed25519.PublicKey:
		return "Ed25519", 256, ""
	}
	return c.PublicKeyAlgorithm.String(), 0, ""
}

// IsSHA1 reports whether a signature algorithm uses SHA-1 (or MD5).
func IsSHA1(alg string) bool {
	a := strings.ToUpper(alg)
	return strings.Contains(a, "SHA1") || strings.Contains(a, "MD5") || strings.Contains(a, "MD2")
}

// Head performs H1: HTTPS HEAD / with our User-Agent, following at most 3
// same-host redirects. All response headers seen on the host are inspected.
func (c *Config) Head(ctx context.Context, host string) (*model.HTTPInfo, *Error) {
	ctx, cancel := context.WithTimeout(ctx, c.Timeout)
	defer cancel()
	var seen []http.Header
	tr := &http.Transport{
		DialContext:       c.Dial,
		TLSClientConfig:   &tls.Config{InsecureSkipVerify: true, ServerName: host}, //nolint:gosec // headers only; chain assessed by P1
		ForceAttemptHTTP2: true,
		Proxy:             nil,
		DisableKeepAlives: true,
	}
	defer tr.CloseIdleConnections()
	client := &http.Client{
		Transport: recordingTransport{tr, &seen},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) > 3 || req.URL.Scheme != "https" || req.URL.Hostname() != host {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}
	u := "https://" + host + "/"
	if c.port() != "443" {
		u = "https://" + net.JoinHostPort(host, c.port()) + "/"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodHead, u, nil)
	if err != nil {
		return nil, &Error{model.ErrTLS, err.Error()}
	}
	req.Header.Set("User-Agent", c.UserAgent)
	resp, err := client.Do(req)
	if err != nil && len(seen) == 0 {
		return nil, Classify(err)
	}
	if resp != nil {
		io.Copy(io.Discard, resp.Body)
		resp.Body.Close()
	}
	return SummariseHeaders(seen), nil
}

type recordingTransport struct {
	rt   http.RoundTripper
	seen *[]http.Header
}

func (r recordingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	resp, err := r.rt.RoundTrip(req)
	if resp != nil {
		*r.seen = append(*r.seen, resp.Header.Clone())
	}
	return resp, err
}

// SummariseHeaders extracts HSTS, Server and CDN hints from the responses seen.
func SummariseHeaders(hs []http.Header) *model.HTTPInfo {
	info := &model.HTTPInfo{}
	var cdn string
	for i, h := range hs {
		if v := h.Get("Strict-Transport-Security"); strings.Contains(strings.ToLower(v), "max-age=") && !strings.Contains(strings.ReplaceAll(strings.ToLower(v), " ", ""), "max-age=0") {
			info.HSTS = true
		}
		if i == 0 {
			info.Server = truncate(h.Get("Server"), 80)
		}
		if cdn == "" || cdn == "other" {
			if d := DetectCDN(h); d != "" {
				cdn = d
			}
		}
	}
	if cdn != "" {
		info.CDN = &cdn
	}
	return info
}

// DetectCDN guesses the CDN from response headers.
func DetectCDN(h http.Header) string {
	server := strings.ToLower(h.Get("Server"))
	via := strings.ToLower(h.Get("Via"))
	servedBy := strings.ToLower(h.Get("X-Served-By"))
	hasPrefix := func(p string) bool {
		for k := range h {
			if strings.HasPrefix(strings.ToLower(k), p) {
				return true
			}
		}
		return false
	}
	switch {
	case h.Get("Cf-Ray") != "" || server == "cloudflare":
		return "cloudflare"
	case hasPrefix("x-akamai") || strings.Contains(server, "akamai") || h.Get("Akamai-Grn") != "":
		return "akamai"
	case h.Get("X-Amz-Cf-Id") != "" || strings.Contains(via, "cloudfront"):
		return "cloudfront"
	case strings.Contains(servedBy, "cache-") || h.Get("X-Fastly-Request-Id") != "" || strings.Contains(via, "varnish") && h.Get("X-Served-By") != "":
		return "fastly"
	case via != "" || h.Get("X-Cache") != "" || h.Get("X-Served-By") != "":
		return "other"
	}
	return ""
}

func truncate(s string, n int) string {
	if len(s) > n {
		return s[:n]
	}
	return s
}
