// Request handling for /api/scan, separated from the route so it can be tested
// with fake DNS, probes and clocks.
import type { SiteResult } from './types';
import { HostError, normalizeHost, resolvePublic, systemResolver, type Resolver } from './ssrf';
import { opensslSupportsPQ, scanHost } from './tlsprobe';
import { scanRequestURL } from './site';

export type ScanDeps = {
  resolver: Resolver;
  scan: (host: string, ip: string) => Promise<SiteResult>;
  opensslVersion: string;
  now: () => number;
  limiter: TokenBucket;
  cache: Map<string, { at: number; result: SiteResult }>;
  tracked?: (host: string) => Pick<SiteResult, 'org' | 'sector' | 'shelfLifeYears'> | undefined;
};

export type ScanResponse = { status: number; body: Record<string, unknown>; headers: Record<string, string> };

export const CACHE_TTL_MS = 24 * 3600 * 1000;
export const TOTAL_BUDGET_MS = 15_000;

/** Best-effort in-memory per-IP token bucket (per serverless instance). */
export class TokenBucket {
  private buckets = new Map<string, { tokens: number; at: number }>();
  constructor(
    private capacity = 5,
    private refillPerMs = 1 / 12_000,
  ) {}
  take(key: string, now: number): boolean {
    const b = this.buckets.get(key) ?? { tokens: this.capacity, at: now };
    b.tokens = Math.min(this.capacity, b.tokens + (now - b.at) * this.refillPerMs);
    b.at = now;
    const ok = b.tokens >= 1;
    if (ok) b.tokens -= 1;
    this.buckets.set(key, b);
    if (this.buckets.size > 10_000) this.buckets.delete(this.buckets.keys().next().value!);
    return ok;
  }
}

const noStore = { 'Cache-Control': 'no-store' };

export async function handleScan(rawHost: unknown, clientIP: string, deps: ScanDeps): Promise<ScanResponse> {
  let host: string;
  try {
    host = normalizeHost(rawHost);
  } catch (e) {
    return { status: 400, body: { reason: 'INVALID_HOST', message: (e as Error).message }, headers: noStore };
  }

  if (!opensslSupportsPQ(deps.opensslVersion)) {
    return {
      status: 503,
      body: { reason: 'PQ_TLS_UNAVAILABLE', message: 'Live scanning needs OpenSSL 3.5 in the server runtime.', requestScanURL: scanRequestURL(host) },
      headers: noStore,
    };
  }

  const cached = deps.cache.get(host);
  if (cached && deps.now() - cached.at < CACHE_TTL_MS) {
    return { status: 200, body: { result: cached.result, scannedAt: new Date(cached.at).toISOString(), cached: true }, headers: cacheHeaders() };
  }

  if (!deps.limiter.take(clientIP || 'unknown', deps.now())) {
    return {
      status: 429,
      body: { reason: 'RATE_LIMITED', message: 'Too many live scans from your address. Please wait a minute.', requestScanURL: scanRequestURL(host) },
      headers: { ...noStore, 'Retry-After': '30' },
    };
  }

  let ips: string[];
  try {
    ips = await resolvePublic(host, deps.resolver);
  } catch (e) {
    const err = e as HostError;
    if (err.reason === 'DNS_FAIL') {
      return { status: 200, body: { result: unreachable(host, 'DNS_FAIL', err.message, deps), scannedAt: new Date(deps.now()).toISOString(), cached: false }, headers: noStore };
    }
    return { status: 400, body: { reason: err.reason, message: err.message }, headers: noStore };
  }

  // Prefer IPv4 (more reliable from serverless egress); always one of the validated addresses.
  const ip = ips.find((a) => !a.includes(':')) ?? ips[0]!;
  const started = deps.now();
  const result = await deps.scan(host, ip);
  const t = deps.tracked?.(host);
  const final = t ? { ...result, org: t.org, sector: t.sector, shelfLifeYears: t.shelfLifeYears } : result;
  if (final.reachable) deps.cache.set(host, { at: started, result: final });
  return {
    status: 200,
    body: { result: final, scannedAt: new Date(started).toISOString(), cached: false, durationMs: deps.now() - started },
    headers: final.reachable ? cacheHeaders() : noStore,
  };
}

function unreachable(host: string, code: 'DNS_FAIL', detail: string, deps: ScanDeps): SiteResult {
  const t = deps.tracked?.(host);
  return {
    host,
    org: t?.org ?? host,
    sector: t?.sector ?? 'other',
    verified: false,
    shelfLifeYears: t?.shelfLifeYears ?? 10,
    reachable: false,
    error: { code, detail },
    grade: null,
    hygieneFlags: [],
    hndlRisk: 0,
  };
}

const cacheHeaders = () => ({ 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' });

/** Production dependencies. */
export function defaultDeps(tracked?: ScanDeps['tracked']): ScanDeps {
  return {
    resolver: systemResolver,
    scan: (host, ip) => {
      const t = tracked?.(host);
      return scanHost(host, ip, { budgetMs: TOTAL_BUDGET_MS - 2_000, sector: t?.sector, org: t?.org, shelfLifeYears: t?.shelfLifeYears });
    },
    opensslVersion: process.versions.openssl ?? '',
    now: Date.now,
    limiter: new TokenBucket(),
    cache: new Map(),
    tracked,
  };
}
