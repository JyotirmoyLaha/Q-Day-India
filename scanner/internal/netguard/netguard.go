// Package netguard keeps ad-hoc scans (the on-demand GitHub workflow) away from
// private, loopback and otherwise non-public networks. It mirrors the SSRF
// rules of apps/web/lib/ssrf.ts.
package netguard

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/netip"
	"regexp"
	"strings"
	"time"

	"golang.org/x/net/idna"
)

var blocked = mustPrefixes(
	// IPv4
	"0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16",
	"172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.88.99.0/24", "192.168.0.0/16",
	"198.18.0.0/15", "198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/4", "240.0.0.0/4",
	// IPv6
	"::/128", "::1/128", "::ffff:0:0/96", "64:ff9b::/96", "64:ff9b:1::/48", "100::/64",
	"2001::/23", "2001:db8::/32", "2002::/16", "fc00::/7", "fe80::/10", "fec0::/10", "ff00::/8",
)

func mustPrefixes(ss ...string) []netip.Prefix {
	out := make([]netip.Prefix, len(ss))
	for i, s := range ss {
		out[i] = netip.MustParsePrefix(s)
	}
	return out
}

// IsPublic reports whether addr is a globally routable unicast address.
func IsPublic(addr netip.Addr) bool {
	if !addr.IsValid() {
		return false
	}
	if addr.Is4In6() {
		// ::ffff:a.b.c.d is judged on its embedded IPv4 address.
		return IsPublic(addr.Unmap())
	}
	for _, p := range blocked {
		if p.Contains(addr) {
			return false
		}
	}
	return true
}

var labelRE = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`)

// NormalizeHost validates a bare hostname (no scheme, port, path or IP literal)
// and returns its lower-case ASCII (punycode) form.
func NormalizeHost(raw string) (string, error) {
	h := strings.TrimSuffix(strings.TrimSpace(raw), ".")
	if h == "" || len(h) > 253 {
		return "", errors.New("hostname is empty or too long")
	}
	if strings.ContainsAny(h, "/:@?#[]\\ %") {
		return "", errors.New("only a bare hostname is allowed (no scheme, port or path)")
	}
	if _, err := netip.ParseAddr(h); err == nil {
		return "", errors.New("IP addresses are not accepted, use a hostname")
	}
	ascii, err := idna.Lookup.ToASCII(h)
	if err != nil {
		return "", fmt.Errorf("invalid hostname: %w", err)
	}
	ascii = strings.ToLower(ascii)
	labels := strings.Split(ascii, ".")
	if len(labels) < 2 {
		return "", errors.New("hostname must contain a dot")
	}
	for _, l := range labels {
		if !labelRE.MatchString(l) {
			return "", fmt.Errorf("invalid hostname label %q", l)
		}
	}
	tld := labels[len(labels)-1]
	if _, err := netip.ParseAddr(ascii); err == nil || regexp.MustCompile(`^[0-9]+$`).MatchString(tld) {
		return "", errors.New("numeric hostnames are not accepted")
	}
	switch tld {
	case "localhost", "local", "internal", "intranet", "lan", "home", "corp", "test", "invalid", "example", "onion":
		return "", fmt.Errorf("reserved top-level domain .%s", tld)
	}
	return ascii, nil
}

// ErrNotPublic is returned when a host resolves to a private or reserved address.
var ErrNotPublic = errors.New("non-public address (private, loopback, link-local or reserved)")

// Resolver is the subset of net.Resolver used here (swappable in tests).
type Resolver interface {
	LookupNetIP(ctx context.Context, network, host string) ([]netip.Addr, error)
}

// CheckPublic resolves host and fails if any address is not public. It returns
// the validated addresses so the caller can connect to them directly.
func CheckPublic(ctx context.Context, r Resolver, host string) ([]netip.Addr, error) {
	if r == nil {
		r = net.DefaultResolver
	}
	addrs, err := r.LookupNetIP(ctx, "ip", host)
	if err != nil {
		return nil, fmt.Errorf("DNS lookup failed: %w", err)
	}
	if len(addrs) == 0 {
		return nil, &net.DNSError{Err: "no addresses", Name: host, IsNotFound: true}
	}
	for _, a := range addrs {
		if !IsPublic(a) {
			return nil, fmt.Errorf("%s resolves to %s: %w", host, a, ErrNotPublic)
		}
	}
	return addrs, nil
}

// Dialer returns a DialContext func that resolves the host itself, refuses
// non-public addresses and connects to a validated IP (so a second, rebinding
// DNS answer can never be used).
func Dialer(r Resolver, timeout time.Duration) func(ctx context.Context, network, addr string) (net.Conn, error) {
	d := &net.Dialer{Timeout: timeout}
	return func(ctx context.Context, network, addr string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(addr)
		if err != nil {
			return nil, err
		}
		if port != "443" {
			return nil, fmt.Errorf("port %s: %w", port, ErrNotPublic)
		}
		ips, err := CheckPublic(ctx, r, host)
		if err != nil {
			return nil, err
		}
		var lastErr error
		for _, ip := range ips {
			c, err := d.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
			if err == nil {
				return c, nil
			}
			lastErr = err
		}
		return nil, lastErr
	}
}
