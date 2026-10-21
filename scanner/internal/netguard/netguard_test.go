package netguard

import (
	"context"
	"net/netip"
	"testing"
)

func TestIsPublic(t *testing.T) {
	private := []string{
		"10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "127.0.0.1", "169.254.169.254",
		"100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "::1", "::", "fe80::1", "fd00:ec2::254",
		"fc00::1", "ff02::1", "::ffff:10.0.0.1", "::ffff:127.0.0.1", "64:ff9b::a00:1", "2002:a00:1::1",
	}
	for _, s := range private {
		if IsPublic(netip.MustParseAddr(s)) {
			t.Errorf("%s should be blocked", s)
		}
	}
	for _, s := range []string{"1.1.1.1", "104.16.132.229", "2606:4700::6810:85e5", "::ffff:8.8.8.8"} {
		if !IsPublic(netip.MustParseAddr(s)) {
			t.Errorf("%s should be public", s)
		}
	}
}

func TestNormalizeHost(t *testing.T) {
	ok := map[string]string{
		"Example.IN":        "example.in",
		"www.onlinesbi.sbi": "www.onlinesbi.sbi",
		"भारत.भारत":         "xn--h2brj9c.xn--h2brj9c",
		"cloudflare.com.":   "cloudflare.com",
	}
	for in, want := range ok {
		got, err := NormalizeHost(in)
		if err != nil || got != want {
			t.Errorf("NormalizeHost(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	bad := []string{
		"", "localhost", "127.0.0.1", "[::1]", "::1", "example.com:8080", "https://example.com",
		"example.com/path", "user@example.com", "intranet", "foo.local", "printer.internal",
		"a..b", "-bad.com", "0x7f.1", "2130706433", "1.2.3.4.5", "foo.localhost", "exa mple.com",
	}
	for _, in := range bad {
		if got, err := NormalizeHost(in); err == nil {
			t.Errorf("NormalizeHost(%q) = %q, want error", in, got)
		}
	}
}

type fakeResolver map[string][]string

func (f fakeResolver) LookupNetIP(_ context.Context, _, host string) ([]netip.Addr, error) {
	var out []netip.Addr
	for _, s := range f[host] {
		out = append(out, netip.MustParseAddr(s))
	}
	return out, nil
}

func TestCheckPublic(t *testing.T) {
	r := fakeResolver{
		"good.example.in":   {"203.0.114.10", "2606:4700::1"},
		"rebind.example.in": {"203.0.114.10", "10.0.0.5"},
		"meta.example.in":   {"169.254.169.254"},
		"empty.example.in":  {},
	}
	if _, err := CheckPublic(context.Background(), r, "good.example.in"); err != nil {
		t.Errorf("good host rejected: %v", err)
	}
	for _, h := range []string{"rebind.example.in", "meta.example.in", "empty.example.in"} {
		if _, err := CheckPublic(context.Background(), r, h); err == nil {
			t.Errorf("%s should be rejected", h)
		}
	}
}
