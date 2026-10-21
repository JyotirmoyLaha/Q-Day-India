// @vitest-environment node
// Mandatory SSRF suite for /api/scan (§5.6, §11).
import { describe, expect, it, vi } from 'vitest';
import { HostError, isPublicAddress, normalizeHost, resolvePublic } from '@/lib/ssrf';
import { handleScan, TokenBucket, type ScanDeps } from '@/lib/scanApi';
import type { SiteResult } from '@/lib/types';

describe('hostname validation', () => {
  it.each([
    ['Example.IN', 'example.in'],
    ['www.onlinesbi.sbi.', 'www.onlinesbi.sbi'],
    ['  cloudflare.com ', 'cloudflare.com'],
    ['भारत.भारत', 'xn--h2brj9c.xn--h2brj9c'],
    ['münchen.de', 'xn--mnchen-3ya.de'],
  ])('accepts %s', (input, want) => expect(normalizeHost(input)).toBe(want));

  it.each([
    // IP literals in every spelling
    '127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', '[::1]', '::ffff:127.0.0.1', 'fe80::1', '2130706433', '0x7f000001', '0177.0.0.1', '127.1', '0.0.0.0',
    // localhost and reserved names
    'localhost', 'localhost.', 'foo.localhost', 'metadata.google.internal', 'printer.local', 'router.lan', 'svc.corp', 'a.test', 'x.example', 'hidden.onion', '1.0.0.127.in-addr.arpa',
    // ports, paths, schemes, credentials, whitespace
    'example.com:8443', 'example.com:443', 'https://example.com', 'example.com/admin', 'user@example.com', 'example.com?x=1', 'example.com#frag', 'exa mple.com', 'example.com\\..\\x', '%6c%6f%63%61%6c%68%6f%73%74',
    // malformed
    '', '.', 'a..b', '-bad.com', 'bad-.com', 'nodot', `${'a'.repeat(64)}.com`, 'x'.repeat(254),
  ])('rejects %j', (input) => {
    expect(() => normalizeHost(input)).toThrow(HostError);
  });

  it('rejects non-strings', () => {
    expect(() => normalizeHost(undefined)).toThrow(HostError);
    expect(() => normalizeHost({ host: 'x.in' })).toThrow(HostError);
  });
});

describe('address classification', () => {
  it.each([
    '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.0.10', '127.0.0.1', '127.255.255.254', '169.254.169.254', '100.64.0.1', '100.127.255.255',
    '0.0.0.0', '224.0.0.251', '239.255.255.250', '255.255.255.255', '192.0.2.1', '198.18.0.1', '::', '::1', 'fe80::1', 'fc00::1', 'fd00:ec2::254',
    'ff02::1', '::ffff:10.0.0.1', '::ffff:7f00:1', '64:ff9b::a00:1', '2002:a00:1::', '2001:db8::1', 'not-an-ip',
  ])('%s is not public', (a) => expect(isPublicAddress(a)).toBe(false));

  it.each(['1.1.1.1', '8.8.8.8', '104.16.132.229', '172.32.0.1', '100.128.0.1', '2606:4700::6810:85e5', '2404:6800:4007::200e', '::ffff:8.8.8.8'])(
    '%s is public',
    (a) => expect(isPublicAddress(a)).toBe(true),
  );
});

describe('DNS checks', () => {
  it('rejects if ANY resolved address is private (mixed answers / rebinding setup)', async () => {
    await expect(resolvePublic('mixed.example.in', async () => ['104.16.1.1', '10.0.0.5'])).rejects.toMatchObject({ reason: 'NON_PUBLIC_ADDRESS' });
    await expect(resolvePublic('v6.example.in', async () => ['2606:4700::1', '::1'])).rejects.toMatchObject({ reason: 'NON_PUBLIC_ADDRESS' });
    await expect(resolvePublic('meta.example.in', async () => ['169.254.169.254'])).rejects.toMatchObject({ reason: 'NON_PUBLIC_ADDRESS' });
    await expect(resolvePublic('nip.example.in', async () => ['127.0.0.1'])).rejects.toMatchObject({ reason: 'NON_PUBLIC_ADDRESS' });
  });
  it('reports DNS failures', async () => {
    await expect(resolvePublic('nx.example.in', async () => { throw new Error('ENOTFOUND'); })).rejects.toMatchObject({ reason: 'DNS_FAIL' });
    await expect(resolvePublic('empty.example.in', async () => [])).rejects.toMatchObject({ reason: 'DNS_FAIL' });
  });
});

const fakeResult = (host: string): SiteResult => ({
  host, org: host, sector: 'other', verified: false, shelfLifeYears: 10, reachable: true, grade: 'C', hygieneFlags: [], hndlRisk: 50,
  tls: { maxVersion: 'TLS1.3', defaultGroup: 'X25519', pqHybrid: { x25519mlkem768: false }, legacyEnabled: false, cipherSuite: 'TLS_AES_128_GCM_SHA256' },
});

function deps(over: Partial<ScanDeps> = {}): ScanDeps {
  return {
    resolver: async () => ['104.16.1.1'],
    scan: vi.fn(async (host: string) => fakeResult(host)),
    opensslVersion: '3.5.4',
    now: () => 1_000_000,
    limiter: new TokenBucket(5),
    cache: new Map(),
    ...over,
  };
}

describe('/api/scan handler', () => {
  it('connects only to the validated IP, even if DNS later rebinds', async () => {
    const answers = [['104.16.1.1'], ['127.0.0.1']];
    let calls = 0;
    const scan = vi.fn(async (host: string, ip: string) => {
      expect(ip).toBe('104.16.1.1');
      return fakeResult(host);
    });
    const r = await handleScan('rebind.example.in', '1.2.3.4', deps({ resolver: async () => answers[calls++]!, scan }));
    expect(r.status).toBe(200);
    expect(calls).toBe(1); // resolved exactly once
    expect(scan).toHaveBeenCalledWith('rebind.example.in', '104.16.1.1');
  });

  it.each(['localhost', '127.0.0.1', 'example.com:22', 'http://10.0.0.1/', '[::1]', 'metadata.google.internal'])('rejects %s with 400 before any DNS or probe', async (h) => {
    const resolver = vi.fn(async () => ['104.16.1.1']);
    const scan = vi.fn();
    const r = await handleScan(h, '1.2.3.4', deps({ resolver, scan }));
    expect(r.status).toBe(400);
    expect(r.body.reason).toBe('INVALID_HOST');
    expect(resolver).not.toHaveBeenCalled();
    expect(scan).not.toHaveBeenCalled();
  });

  it('rejects hostnames that resolve to private addresses', async () => {
    const scan = vi.fn();
    const r = await handleScan('internal.example.in', '1.2.3.4', deps({ resolver: async () => ['192.168.1.10'], scan }));
    expect(r.status).toBe(400);
    expect(r.body.reason).toBe('NON_PUBLIC_ADDRESS');
    expect(scan).not.toHaveBeenCalled();
  });

  it('returns 503 PQ_TLS_UNAVAILABLE with a GitHub fallback when OpenSSL < 3.5', async () => {
    const r = await handleScan('example.in', '1.2.3.4', deps({ opensslVersion: '3.0.13' }));
    expect(r.status).toBe(503);
    expect(r.body.reason).toBe('PQ_TLS_UNAVAILABLE');
    expect(String(r.body.requestScanURL)).toMatch(/issues\/new\?.*scan-request/);
  });

  it('rate-limits per client IP and serves cache hits without spending tokens', async () => {
    const d = deps({ limiter: new TokenBucket(2) });
    expect((await handleScan('a.example.in', '9.9.9.9', d)).status).toBe(200);
    expect((await handleScan('b.example.in', '9.9.9.9', d)).status).toBe(200);
    expect((await handleScan('c.example.in', '9.9.9.9', d)).status).toBe(429);
    const cached = await handleScan('a.example.in', '9.9.9.9', d);
    expect(cached.status).toBe(200);
    expect(cached.body.cached).toBe(true);
    expect(cached.headers['Cache-Control']).toMatch(/s-maxage=86400/);
    expect((await handleScan('c.example.in', '8.8.4.4', d)).status).toBe(200); // other client unaffected
  });

  it('turns DNS failure into an ungraded result', async () => {
    const r = await handleScan('nx.example.in', '1.2.3.4', deps({ resolver: async () => { throw new Error('ENOTFOUND'); } }));
    expect(r.status).toBe(200);
    expect((r.body.result as SiteResult).error?.code).toBe('DNS_FAIL');
    expect(r.headers['Cache-Control']).toBe('no-store');
  });
});
