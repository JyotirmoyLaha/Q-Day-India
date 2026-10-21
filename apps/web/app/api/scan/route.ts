// On-demand single-host scan (§5.6). Node.js runtime: needs node:tls with OpenSSL ≥ 3.5.
import { NextResponse, type NextRequest } from 'next/server';
import { defaultDeps, handleScan } from '@/lib/scanApi';
import { getSite } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

// Module scope: rate-limit buckets and the result cache survive warm invocations.
const deps = defaultDeps((host) => {
  const s = getSite(host);
  return s ? { org: s.org, sector: s.sector, shelfLifeYears: s.shelfLifeYears } : undefined;
});

function clientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

async function respond(host: unknown, req: NextRequest) {
  const r = await handleScan(host, clientIP(req), deps);
  return NextResponse.json(r.body, { status: r.status, headers: r.headers });
}

/** GET /api/scan?host=example.in — cacheable at the edge for 24 h. */
export async function GET(req: NextRequest) {
  return respond(req.nextUrl.searchParams.get('host'), req);
}

/** POST /api/scan { "host": "example.in" } */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  return respond((body as { host?: unknown })?.host, req);
}
