// Share a code report without a backend: the report is compressed into the URL
// fragment (#r=…). Browsers never send the fragment to any server.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Finding, ScanReport } from '@qday/cbom-engine';

export const MAX_FRAGMENT_CHARS = 30_000;

// Compact positional encoding of a finding (keeps URLs short).
type F = [
  string,
  string,
  number,
  number,
  string,
  string,
  number | 0,
  string,
  string,
  string,
  string | 0,
  string,
  string,
  string,
  string | 0,
];

const pack = (f: Finding): F => [
  f.ruleId,
  f.file,
  f.line,
  f.column,
  f.snippet,
  f.algorithm,
  f.keySize ?? 0,
  f.primitive,
  f.quantumRisk,
  f.confidence,
  f.fixId ?? 0,
  f.message,
  f.assetType,
  f.kind,
  f.parameter ?? 0,
];

const unpack = (a: F): Finding => ({
  ruleId: a[0],
  file: a[1],
  line: a[2],
  column: a[3],
  snippet: a[4],
  algorithm: a[5],
  ...(a[6] ? { keySize: a[6] } : {}),
  primitive: a[7] as Finding['primitive'],
  quantumRisk: a[8] as Finding['quantumRisk'],
  confidence: a[9] as Finding['confidence'],
  ...(a[10] ? { fixId: a[10] } : {}),
  message: a[11],
  assetType: a[12] as Finding['assetType'],
  kind: a[13] as Finding['kind'],
  ...(a[14] ? { parameter: a[14] } : {}),
});

export function encodeReport(r: ScanReport): string {
  const compact = {
    v: 1,
    t: r.tool,
    at: r.scannedAt,
    s: r.source,
    st: r.stats,
    sc: r.scores,
    w: r.warnings,
    f: r.findings.map(pack),
  };
  return compressToEncodedURIComponent(JSON.stringify(compact));
}

export function decodeReport(fragment: string): ScanReport | null {
  try {
    const raw = fragment.replace(/^#?r=/, '');
    const json = decompressFromEncodedURIComponent(raw);
    if (!json) return null;
    const c = JSON.parse(json);
    if (c.v !== 1 || !Array.isArray(c.f)) return null;
    return {
      tool: c.t,
      scannedAt: c.at,
      source: c.s,
      stats: c.st,
      scores: c.sc,
      warnings: c.w ?? [],
      findings: (c.f as F[]).map(unpack),
    };
  } catch {
    return null;
  }
}

/** Returns a shareable URL, or null if the report is too large for a fragment. */
export function shareURL(r: ScanReport, base: string): string | null {
  const enc = encodeReport(r);
  if (enc.length > MAX_FRAGMENT_CHARS) return null;
  return `${base.split('#')[0]}#r=${enc}`;
}

export function download(name: string, data: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
