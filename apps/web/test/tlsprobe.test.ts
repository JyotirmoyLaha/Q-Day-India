// @vitest-environment node
// TLS probes against local Node TLS servers (offline) and real hosts (QDAY_LIVE_TESTS=1).
import { afterAll, describe, expect, it } from 'vitest';
import tls from 'node:tls';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Socket, type AddressInfo } from 'node:net';
import { opensslSupportsPQ, scanHost } from '@/lib/tlsprobe';
import { resolvePublic } from '@/lib/ssrf';
import { detectCDN } from '@/lib/cdn';

const PEM = join(__dirname, '../../../packages/cbom-engine/test/fixtures/pem');
const key = readFileSync(join(PEM, 'server.key'));
const cert = readFileSync(join(PEM, 'server.crt'));
const servers: tls.Server[] = [];
afterAll(() => servers.forEach((s) => s.close()));

async function local(opts: tls.TlsOptions) {
  const server = tls.createServer({ key, cert, ...opts }, (s) => s.end());
  servers.push(server);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const port = (server.address() as AddressInfo).port;
  // Point the prober's port-443 connections at the local test server.
  return (o: tls.ConnectionOptions) => tls.connect({ ...o, host: '127.0.0.1', port });
}
const noHead = async () => ({ hsts: true, cdn: null });

describe('openssl version gate', () => {
  it('requires ≥ 3.5', () => {
    expect(opensslSupportsPQ('3.5.0')).toBe(true);
    expect(opensslSupportsPQ('3.6.1')).toBe(true);
    expect(opensslSupportsPQ('4.0.0')).toBe(true);
    expect(opensslSupportsPQ('3.0.13+quic')).toBe(false);
    expect(opensslSupportsPQ('1.1.1w')).toBe(false);
    expect(opensslSupportsPQ(process.versions.openssl)).toBe(true); // this runtime
  });
});

describe('probes against local servers', () => {
  it('PQ-capable server: X25519MLKEM768 default + P2 pass (cert untrusted → F, CERT_INVALID)', async () => {
    const connect = await local({ ecdhCurve: 'X25519MLKEM768:X25519:prime256v1' });
    const r = await scanHost('test.example.in', '127.0.0.1', { connect, headFn: noHead });
    expect(r.tls?.pqHybrid.x25519mlkem768).toBe(true);
    expect(r.tls?.defaultGroup).toBe('X25519MLKEM768');
    expect(r.tls?.maxVersion).toBe('TLS1.3');
    expect(r.cert?.keyAlgorithm).toBe('RSA');
    expect(r.cert?.keySize).toBe(2048);
    expect(r.cert?.valid).toBe(false);
    expect(r.hygieneFlags).toContain('CERT_INVALID');
    expect(r.grade).toBe('F');
  });

  it('classical-only server: no PQ, X25519 default', async () => {
    const connect = await local({ ecdhCurve: 'X25519:prime256v1' });
    const r = await scanHost('test.example.in', '127.0.0.1', { connect, headFn: noHead });
    expect(r.tls?.pqHybrid.x25519mlkem768).toBe(false);
    expect(r.tls?.defaultGroup).toBe('X25519');
    expect(r.probes?.pqOnly.ok).toBe(false);
  });

  it('TLS 1.2-only server with legacy versions enabled', async () => {
    const connect = await local({
      minVersion: 'TLSv1',
      maxVersion: 'TLSv1.2',
      ciphers: 'DEFAULT@SECLEVEL=0',
      ecdhCurve: 'prime256v1',
    });
    const r = await scanHost('test.example.in', '127.0.0.1', { connect, headFn: noHead });
    expect(r.tls?.maxVersion).toBe('TLS1.2');
    expect(r.tls?.legacyEnabled).toBe(true);
    expect(r.tls?.defaultGroup).toBe('P-256');
    expect(r.hygieneFlags).toContain('LEGACY_TLS');
  });

  it('respects the time budget', async () => {
    const t0 = Date.now();
    const connect = () => new tls.TLSSocket(new Socket()); // never connects
    const r = await scanHost('slow.example.in', '192.0.2.1', {
      connect: connect as never,
      budgetMs: 1500,
      headFn: noHead,
    });
    expect(Date.now() - t0).toBeLessThan(4000);
    expect(r.reachable).toBe(false);
    expect(r.error?.code).toBe('TIMEOUT');
  });
});

describe('CDN detection', () => {
  it('matches the Go scanner', () => {
    expect(detectCDN({ 'cf-ray': 'x' })).toBe('cloudflare');
    expect(detectCDN({ 'x-akamai-transformed': '9' })).toBe('akamai');
    expect(detectCDN({ 'x-amz-cf-id': 'x' })).toBe('cloudfront');
    expect(detectCDN({ 'x-served-by': 'cache-bom123' })).toBe('fastly');
    expect(detectCDN({ via: '1.1 squid' })).toBe('other');
    expect(detectCDN({ server: 'nginx' })).toBeNull();
  });
});

describe.runIf(process.env.QDAY_LIVE_TESTS === '1')('live hosts', () => {
  it('cloudflare.com supports X25519MLKEM768 and is graded A/A+ in < 15 s', async () => {
    const t0 = Date.now();
    const [ip] = await resolvePublic('cloudflare.com');
    const r = await scanHost('cloudflare.com', ip!, { budgetMs: 13_000 });
    const ms = Date.now() - t0;
    console.log(`cloudflare.com: ${r.grade} ${r.tls?.defaultGroup} in ${ms} ms`);
    expect(r.tls?.pqHybrid.x25519mlkem768).toBe(true);
    expect(r.tls?.defaultGroup).toBe('X25519MLKEM768');
    expect(['A', 'A+']).toContain(r.grade);
    expect(ms).toBeLessThan(15_000);
  }, 20_000);

  it('negative fixture www.aiims.edu does not offer PQ', async () => {
    const ips = await resolvePublic('www.aiims.edu');
    const r = await scanHost('www.aiims.edu', ips.find((a) => !a.includes(':')) ?? ips[0]!, {
      budgetMs: 13_000,
      sector: 'healthcare',
    });
    console.log(`www.aiims.edu: ${r.grade} ${r.tls?.defaultGroup}`);
    if (!r.reachable) return;
    expect(r.tls?.pqHybrid.x25519mlkem768).toBe(false);
  }, 20_000);
});
