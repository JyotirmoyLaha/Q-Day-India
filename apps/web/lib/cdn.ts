// CDN detection from response headers; mirrors probe.DetectCDN in the Go scanner.
import type { CDN } from './types';

export function detectCDN(headers: Record<string, string | string[] | undefined>): CDN {
  const h = (k: string) => {
    const v = headers[k.toLowerCase()];
    return (Array.isArray(v) ? v.join(',') : (v ?? '')).toLowerCase();
  };
  const keys = Object.keys(headers).map((k) => k.toLowerCase());
  const server = h('server');
  const via = h('via');
  const servedBy = h('x-served-by');
  if (h('cf-ray') || server === 'cloudflare') return 'cloudflare';
  if (keys.some((k) => k.startsWith('x-akamai')) || server.includes('akamai') || h('akamai-grn')) return 'akamai';
  if (h('x-amz-cf-id') || via.includes('cloudfront')) return 'cloudfront';
  if (servedBy.includes('cache-') || h('x-fastly-request-id') || (via.includes('varnish') && servedBy)) return 'fastly';
  if (via || h('x-cache') || servedBy) return 'other';
  return null;
}
