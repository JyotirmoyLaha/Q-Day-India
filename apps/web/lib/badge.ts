// Shields-style SVG badges for /api/badge. Pure function so it runs on the edge.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Approximate Verdana 11px advance widths (good enough for badge layout).
function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += /[ijlI.,:;!|' ]/.test(ch) ? 3.4 : /[mwMW@]/.test(ch) ? 9.5 : /[A-Z+0-9]/.test(ch) ? 7.4 : 6.4;
  return Math.ceil(w);
}

export const BADGE_COLORS = {
  safe: '#0f766e',
  partial: '#3f8f7f',
  exposed: '#b45309',
  danger: '#b42318',
  unknown: '#6b7280',
} as const;

export function gradeColor(grade: string | null | undefined): string {
  if (grade === 'A+' || grade === 'A') return BADGE_COLORS.safe;
  if (grade === 'B') return BADGE_COLORS.partial;
  if (grade === 'C' || grade === 'D') return BADGE_COLORS.exposed;
  if (grade === 'F') return BADGE_COLORS.danger;
  return BADGE_COLORS.unknown;
}

export function exposureColor(score: number): string {
  return score <= 20 ? BADGE_COLORS.safe : score <= 50 ? BADGE_COLORS.partial : BADGE_COLORS.exposed;
}

export function badgeSVG(label: string, message: string, color: string, title?: string): string {
  const lw = textWidth(label) + 12;
  const mw = textWidth(message) + 12;
  const w = lw + mw;
  const t = esc(title ?? `${label}: ${message}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${t}"><title>${t}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${mw}" height="20" fill="${color}"/><rect width="${w}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(label)}</text><text x="${lw / 2}" y="14">${esc(label)}</text><text x="${lw + mw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(message)}</text><text x="${lw + mw / 2}" y="14">${esc(message)}</text></g></svg>`;
}

export type BadgeData = {
  hosts: Record<string, { g: string | null; d: string; v: boolean }>;
  repos: Record<string, { repo: string; exposure: number; agility: number; scannedAt: string }>;
};

/** Builds the badge for ?host= or ?repo= from build-time data (no live scanning). */
export function badgeFor(params: URLSearchParams, data: BadgeData): { svg: string; found: boolean } {
  const host = params.get('host')?.trim().toLowerCase();
  const repo = params.get('repo')?.trim().toLowerCase();
  if (host) {
    const h = data.hosts[host] ?? data.hosts[`www.${host}`];
    if (!h) return { svg: badgeSVG('quantum-safe TLS', 'not tracked', BADGE_COLORS.unknown), found: false };
    const msg = h.g ?? 'unreachable';
    return { svg: badgeSVG('quantum-safe TLS', msg, gradeColor(h.g), `quantum-safe TLS grade ${msg} for ${host}, scanned ${h.d}`), found: true };
  }
  if (repo) {
    const r = data.repos[repo];
    if (!r) return { svg: badgeSVG('quantum exposure', 'unknown', BADGE_COLORS.unknown), found: false };
    return { svg: badgeSVG('quantum exposure', `${r.exposure}/100`, exposureColor(r.exposure), `QuantumBOM quantum exposure ${r.exposure}/100 for ${r.repo}, scanned ${r.scannedAt.slice(0, 10)}`), found: true };
  }
  return { svg: badgeSVG('quantum-safe TLS', 'host or repo required', BADGE_COLORS.unknown), found: false };
}
