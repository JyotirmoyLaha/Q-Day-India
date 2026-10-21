import type { SiteResult } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "2026-10-21" or ISO timestamp → "21 Oct 2026" (stable, locale-independent, UTC). */
export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "2026-10" → "October 2026". */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${LONG_MONTHS[(m ?? 1) - 1]} ${y}`;
}

export const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((100 * n) / d));

/** "RSA-2048", "ECDSA P-256", "Ed25519". */
export function certAlgorithm(cert: SiteResult['cert']): string {
  if (!cert) return '—';
  if (cert.keyAlgorithm === 'ECDSA') return `ECDSA ${cert.curve || `P-${cert.keySize}`}`;
  if (cert.keyAlgorithm === 'RSA') return `RSA-${cert.keySize}`;
  return cert.keyAlgorithm;
}

/** Turns "CN=WE1,O=Google Trust Services,C=US" into "Google Trust Services (WE1)". */
export function issuerName(issuer: string): string {
  const parts = Object.fromEntries(
    issuer
      .split(/,(?=[A-Z]+=)/)
      .map((p) => p.split('='))
      .filter((p) => p.length >= 2)
      .map(([k, ...v]) => [k, v.join('=')]),
  );
  if (parts.O && parts.CN) return `${parts.O} (${parts.CN})`;
  return parts.O || parts.CN || issuer;
}

export const groupLabel = (g: string) =>
  ({
    X25519MLKEM768: 'X25519MLKEM768 (hybrid PQ)',
    SecP256r1MLKEM768: 'SecP256r1MLKEM768 (hybrid PQ)',
    SecP384r1MLKEM1024: 'SecP384r1MLKEM1024 (hybrid PQ)',
  })[g] ?? g;
