// Command qday-scan measures post-quantum TLS readiness of public hosts.
//
//	qday-scan --targets targets/india.yaml --out data/ --date 2026-10-21
//	qday-scan --host example.in --json
package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"os"
	"os/signal"
	"path/filepath"
	"time"

	"github.com/qday-india/qday-india/scanner/internal/model"
	"github.com/qday-india/qday-india/scanner/internal/netguard"
	"github.com/qday-india/qday-india/scanner/internal/probe"
	"github.com/qday-india/qday-india/scanner/internal/scan"
	"github.com/qday-india/qday-india/scanner/internal/targets"
)

func main() {
	os.Exit(run(os.Args[1:]))
}

func run(args []string) int {
	fs := flag.NewFlagSet("qday-scan", flag.ContinueOnError)
	targetsPath := fs.String("targets", "", "target list (YAML)")
	optoutPath := fs.String("optout", "", "opt-out list (default: optout.txt next to --targets)")
	outDir := fs.String("out", "data", "output directory (writes scans/DATE.json and latest.json)")
	date := fs.String("date", time.Now().UTC().Format("2006-01-02"), "scan date for the output file name")
	host := fs.String("host", "", "scan a single host")
	asJSON := fs.Bool("json", false, "with --host: print the result as JSON")
	sector := fs.String("sector", "other", "with --host: sector used for HNDL scoring")
	org := fs.String("org", "", "with --host: organisation name")
	concurrency := fs.Int("concurrency", 8, "hosts scanned in parallel")
	gap := fs.Duration("gap", 300*time.Millisecond, "pause between probes on the same host")
	timeout := fs.Duration("timeout", 10*time.Second, "timeout per probe")
	siteURL := fs.String("site-url", "https://q-day-india.vercel.app", "site URL used in the User-Agent")
	allowPrivate := fs.Bool("allow-private", false, "allow scanning non-public addresses (local testing only)")
	if err := fs.Parse(args); err != nil {
		return 2
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	pc := probe.Default(fmt.Sprintf("QDayIndiaScanner/%s (+%s/about/scanner)", "1.0", *siteURL))
	pc.Timeout = *timeout
	if !*allowPrivate {
		pc.Dial = netguard.Dialer(net.DefaultResolver, *timeout)
	}
	opts := scan.Options{Probe: pc, Concurrency: *concurrency, Gap: *gap}

	if *host != "" {
		h, err := netguard.NormalizeHost(*host)
		if err != nil {
			fmt.Fprintln(os.Stderr, "qday-scan:", err)
			return 2
		}
		name := *org
		if name == "" {
			name = h
		}
		r := scan.Host(ctx, targets.Target{Host: h, Org: name, Sector: *sector}, opts)
		if *asJSON {
			return printJSON(r)
		}
		printHuman(r)
		return 0
	}

	if *targetsPath == "" {
		fmt.Fprintln(os.Stderr, "qday-scan: either --targets or --host is required")
		fs.Usage()
		return 2
	}
	ts, err := targets.Load(*targetsPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, "qday-scan:", err)
		return 1
	}
	if *optoutPath == "" {
		*optoutPath = filepath.Join(filepath.Dir(*targetsPath), "optout.txt")
	}
	oo, err := targets.LoadOptOut(*optoutPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, "qday-scan:", err)
		return 1
	}
	ts = oo.Filter(ts)
	if _, err := time.Parse("2006-01-02", *date); err != nil {
		fmt.Fprintln(os.Stderr, "qday-scan: --date must be YYYY-MM-DD")
		return 2
	}

	start := time.Now()
	opts.Progress = func(done, total int, r model.SiteResult) {
		g := "—"
		if r.Grade != nil {
			g = *r.Grade
		} else if r.Error != nil {
			g = "— " + r.Error.Code
		}
		fmt.Fprintf(os.Stderr, "[%3d/%d] %-40s %s\n", done, total, r.Host, g)
	}
	results := scan.Run(ctx, ts, opts)
	file := scan.NewFile(results, start)
	b, err := json.MarshalIndent(file, "", "  ")
	if err != nil {
		fmt.Fprintln(os.Stderr, "qday-scan:", err)
		return 1
	}
	b = append(b, '\n')
	if err := os.MkdirAll(filepath.Join(*outDir, "scans"), 0o755); err != nil {
		fmt.Fprintln(os.Stderr, "qday-scan:", err)
		return 1
	}
	for _, p := range []string{filepath.Join(*outDir, "scans", *date+".json"), filepath.Join(*outDir, "latest.json")} {
		if err := os.WriteFile(p, b, 0o644); err != nil {
			fmt.Fprintln(os.Stderr, "qday-scan:", err)
			return 1
		}
		fmt.Fprintln(os.Stderr, "wrote", p)
	}
	fmt.Fprintf(os.Stderr, "scanned %d hosts in %s\n", len(results), time.Since(start).Round(time.Second))
	return 0
}

func printJSON(v any) int {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		fmt.Fprintln(os.Stderr, "qday-scan:", err)
		return 1
	}
	return 0
}

func printHuman(r model.SiteResult) {
	if !r.Reachable {
		fmt.Printf("%s: unreachable (%s: %s)\n", r.Host, r.Error.Code, r.Error.Detail)
		return
	}
	fmt.Printf("%s\n  grade:          %s\n  max TLS:        %s\n  default group:  %s\n  X25519MLKEM768: %v\n  legacy TLS:     %v\n  certificate:    %s-%d (%s)\n  HNDL exposure:  %d/100\n  hygiene:        %v\n",
		r.Host, *r.Grade, r.TLS.MaxVersion, r.TLS.DefaultGroup, r.TLS.PQHybrid.X25519MLKEM768, r.TLS.LegacyEnabled,
		r.Cert.KeyAlgorithm, r.Cert.KeySize, r.Cert.SignatureAlgorithm, r.HNDLRisk, r.HygieneFlags)
}
