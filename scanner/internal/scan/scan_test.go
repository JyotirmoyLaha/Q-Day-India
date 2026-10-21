package scan

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"testing"
	"time"

	"github.com/qday-india/qday-india/scanner/internal/model"
	"github.com/qday-india/qday-india/scanner/internal/probe"
	"github.com/qday-india/qday-india/scanner/internal/targets"
)

const testHost = "bank.example.in"

type pki struct {
	roots *x509.CertPool
	leaf  tls.Certificate
}

// newPKI builds a CA and a leaf for testHost. keyBits > 0 makes an RSA leaf.
func newPKI(t *testing.T, keyBits int, notAfter time.Time) pki {
	t.Helper()
	caKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	caTmpl := &x509.Certificate{
		SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "Test Root"},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(10 * 365 * 24 * time.Hour),
		IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign,
	}
	caDER, err := x509.CreateCertificate(rand.Reader, caTmpl, caTmpl, &caKey.PublicKey, caKey)
	if err != nil {
		t.Fatal(err)
	}
	ca, _ := x509.ParseCertificate(caDER)
	var pub, priv any
	if keyBits > 0 {
		k, _ := rsa.GenerateKey(rand.Reader, keyBits)
		pub, priv = &k.PublicKey, k
	} else {
		k, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		pub, priv = &k.PublicKey, k
	}
	leafTmpl := &x509.Certificate{
		SerialNumber: big.NewInt(2), Subject: pkix.Name{CommonName: testHost}, DNSNames: []string{testHost},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: notAfter,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}, KeyUsage: x509.KeyUsageDigitalSignature,
	}
	leafDER, err := x509.CreateCertificate(rand.Reader, leafTmpl, ca, pub, caKey)
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	roots.AddCert(ca)
	return pki{roots: roots, leaf: tls.Certificate{Certificate: [][]byte{leafDER, caDER}, PrivateKey: priv}}
}

// server starts an HTTPS server with the given TLS settings and returns
// scan options whose dialer always connects to it.
func server(t *testing.T, p pki, hsts bool, mutate func(*tls.Config)) Options {
	t.Helper()
	srv := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if hsts {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000")
		}
		w.Header().Set("Server", "test-nginx")
	}))
	srv.TLS = &tls.Config{Certificates: []tls.Certificate{p.leaf}}
	if mutate != nil {
		mutate(srv.TLS)
	}
	srv.StartTLS()
	t.Cleanup(srv.Close)
	addr := srv.Listener.Addr().String()
	pc := probe.Default("QDayIndiaScanner/test")
	pc.Timeout = 3 * time.Second
	pc.RootCAs = p.roots
	pc.Dial = func(ctx context.Context, network, _ string) (net.Conn, error) {
		var d net.Dialer
		return d.DialContext(ctx, network, addr)
	}
	return Options{Probe: pc, Gap: time.Millisecond}
}

var bank = targets.Target{Host: testHost, Org: "Test Bank", Sector: "banking"}

func gradeOf(r model.SiteResult) string {
	if r.Grade == nil {
		return "—"
	}
	return *r.Grade
}

func TestModernServerIsAPlus(t *testing.T) {
	p := newPKI(t, 0, time.Now().Add(90*24*time.Hour))
	r := Host(context.Background(), bank, server(t, p, true, nil))
	if gradeOf(r) != "A+" {
		t.Fatalf("grade %s, result %+v", gradeOf(r), r.Probes)
	}
	if r.TLS.DefaultGroup != "X25519MLKEM768" || !r.TLS.PQHybrid.X25519MLKEM768 {
		t.Errorf("expected PQ default group, got %+v", r.TLS)
	}
	if r.TLS.PQHybrid.SecP256r1MLKEM768 == nil || !*r.TLS.PQHybrid.SecP256r1MLKEM768 {
		t.Errorf("Go servers support SecP256r1MLKEM768 by default: %+v", r.TLS.PQHybrid)
	}
	if r.HNDLRisk != 0 || len(r.HygieneFlags) != 0 {
		t.Errorf("risk %d flags %v", r.HNDLRisk, r.HygieneFlags)
	}
	if r.Cert.KeyAlgorithm != "ECDSA" || r.Cert.KeySize != 256 || !r.Cert.Valid {
		t.Errorf("cert %+v", r.Cert)
	}
	if !r.HTTP.HSTS || r.HTTP.Server != "test-nginx" {
		t.Errorf("http %+v", r.HTTP)
	}
}

func TestClassicalTLS13IsC(t *testing.T) {
	p := newPKI(t, 2048, time.Now().Add(90*24*time.Hour))
	o := server(t, p, false, func(c *tls.Config) { c.CurvePreferences = []tls.CurveID{tls.X25519, tls.CurveP256} })
	r := Host(context.Background(), bank, o)
	if gradeOf(r) != "C" || r.TLS.DefaultGroup != "X25519" || r.TLS.PQHybrid.X25519MLKEM768 {
		t.Fatalf("grade %s tls %+v", gradeOf(r), r.TLS)
	}
	if r.HNDLRisk != 60 {
		t.Errorf("banking C should be 60, got %d", r.HNDLRisk)
	}
	if !slices.Contains(r.HygieneFlags, model.FlagNoHSTS) {
		t.Errorf("expected NO_HSTS, got %v", r.HygieneFlags)
	}
	if r.Cert.KeyAlgorithm != "RSA" || r.Cert.KeySize != 2048 {
		t.Errorf("cert %+v", r.Cert)
	}
}

func TestTLS12OnlyIsD(t *testing.T) {
	p := newPKI(t, 0, time.Now().Add(90*24*time.Hour))
	o := server(t, p, true, func(c *tls.Config) { c.MaxVersion = tls.VersionTLS12 })
	r := Host(context.Background(), bank, o)
	if gradeOf(r) != "D" || r.TLS.MaxVersion != "TLS1.2" {
		t.Fatalf("grade %s tls %+v", gradeOf(r), r.TLS)
	}
}

func TestLegacyEnabledAndExpiring(t *testing.T) {
	p := newPKI(t, 1024, time.Now().Add(5*24*time.Hour))
	o := server(t, p, true, func(c *tls.Config) { c.MinVersion = tls.VersionTLS10 })
	r := Host(context.Background(), bank, o)
	if gradeOf(r) != "A" || !r.TLS.LegacyEnabled {
		t.Fatalf("PQ + legacy should be A, got %s %+v", gradeOf(r), r.TLS)
	}
	for _, f := range []string{model.FlagLegacyTLS, model.FlagCertExpiring, model.FlagRSAWeak} {
		if !slices.Contains(r.HygieneFlags, f) {
			t.Errorf("missing flag %s in %v", f, r.HygieneFlags)
		}
	}
}

func TestLegacyOnlyIsF(t *testing.T) {
	p := newPKI(t, 2048, time.Now().Add(90*24*time.Hour))
	o := server(t, p, true, func(c *tls.Config) { c.MinVersion, c.MaxVersion = tls.VersionTLS10, tls.VersionTLS11 })
	r := Host(context.Background(), bank, o)
	if gradeOf(r) != "F" || !r.Reachable || r.TLS.MaxVersion != "TLS1.1" {
		t.Fatalf("grade %s reachable %v tls %+v err %+v", gradeOf(r), r.Reachable, r.TLS, r.Error)
	}
}

func TestUntrustedChainIsF(t *testing.T) {
	p := newPKI(t, 0, time.Now().Add(90*24*time.Hour))
	o := server(t, p, true, nil)
	o.Probe.RootCAs = x509.NewCertPool() // the server's CA is not trusted
	r := Host(context.Background(), bank, o)
	if gradeOf(r) != "F" || r.Cert.Valid || !slices.Contains(r.HygieneFlags, model.FlagCertInvalid) {
		t.Fatalf("grade %s cert %+v flags %v", gradeOf(r), r.Cert, r.HygieneFlags)
	}
}

func TestRefusedIsUngraded(t *testing.T) {
	l, _ := net.Listen("tcp", "127.0.0.1:0")
	addr := l.Addr().String()
	l.Close() // nothing listens here any more
	pc := probe.Default("test")
	pc.Timeout, pc.Retries = time.Second, 0
	pc.Dial = func(ctx context.Context, network, _ string) (net.Conn, error) {
		var d net.Dialer
		return d.DialContext(ctx, network, addr)
	}
	r := Host(context.Background(), bank, Options{Probe: pc})
	if r.Reachable || r.Grade != nil || r.Error == nil || r.Error.Code != model.ErrRefused {
		t.Fatalf("got %+v", r)
	}
}

func TestDNSFailure(t *testing.T) {
	pc := probe.Default("test")
	pc.Dial = func(context.Context, string, string) (net.Conn, error) {
		return nil, &net.DNSError{Err: "no such host", Name: testHost, IsNotFound: true}
	}
	r := Host(context.Background(), bank, Options{Probe: pc})
	if r.Error == nil || r.Error.Code != model.ErrDNS || r.HNDLRisk != 0 {
		t.Fatalf("got %+v", r)
	}
}

func TestRunSortsAndCounts(t *testing.T) {
	pc := probe.Default("test")
	pc.Dial = func(context.Context, string, string) (net.Conn, error) {
		return nil, &net.DNSError{Err: "no such host", IsNotFound: true}
	}
	ts := []targets.Target{{Host: "c.in", Sector: "media"}, {Host: "a.in", Sector: "media"}, {Host: "b.in", Sector: "media"}}
	calls := 0
	rs := Run(context.Background(), ts, Options{Probe: pc, Concurrency: 2, Progress: func(int, int, model.SiteResult) { calls++ }})
	if rs[0].Host != "a.in" || rs[2].Host != "c.in" || calls != 3 {
		t.Fatalf("not sorted or progress missing: %v %d", rs, calls)
	}
}

func TestDetectCDN(t *testing.T) {
	cases := map[string]http.Header{
		"cloudflare": {"Cf-Ray": {"abc"}},
		"akamai":     {"X-Akamai-Transformed": {"9"}},
		"cloudfront": {"X-Amz-Cf-Id": {"x"}},
		"fastly":     {"X-Served-By": {"cache-bom123"}},
		"other":      {"Via": {"1.1 squid"}},
		"":           {"Server": {"nginx"}},
	}
	for want, h := range cases {
		if got := probe.DetectCDN(h); got != want {
			t.Errorf("DetectCDN(%v) = %q want %q", h, got, want)
		}
	}
}

// Live tests hit the public internet; run with QDAY_LIVE_TESTS=1.
func live(t *testing.T) Options {
	if os.Getenv("QDAY_LIVE_TESTS") != "1" {
		t.Skip("set QDAY_LIVE_TESTS=1 to run live TLS tests")
	}
	return Options{Probe: probe.Default("QDayIndiaScanner/1.0 (test)"), Gap: 300 * time.Millisecond}
}

func TestLiveCloudflareIsPQ(t *testing.T) {
	o := live(t)
	r := Host(context.Background(), targets.Target{Host: "cloudflare.com", Org: "Cloudflare", Sector: "other"}, o)
	if !r.TLS.PQHybrid.X25519MLKEM768 {
		t.Fatal("cloudflare.com must pass P2")
	}
	if r.TLS.DefaultGroup != "X25519MLKEM768" {
		t.Fatalf("P1 should negotiate X25519MLKEM768, got %s", r.TLS.DefaultGroup)
	}
	if g := gradeOf(r); g != "A" && g != "A+" {
		t.Fatalf("grade %s", g)
	}
}

// Negative fixture: an older nginx stack (TLS 1.2 max, no PQ) observed on 2026-10-21.
// If the site upgrades, pick another host that fails P2 and update this test.
func TestLiveNegativeFixture(t *testing.T) {
	o := live(t)
	r := Host(context.Background(), targets.Target{Host: "www.aiims.edu", Org: "AIIMS", Sector: "healthcare"}, o)
	if !r.Reachable {
		t.Skipf("negative fixture unreachable: %+v", r.Error)
	}
	if r.TLS.PQHybrid.X25519MLKEM768 {
		t.Fatal("negative fixture now supports PQ — choose a new negative fixture")
	}
}
