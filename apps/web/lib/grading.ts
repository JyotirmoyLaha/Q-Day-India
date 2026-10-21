// TypeScript twin of scanner/internal/grade (PROJECT_SPEC.md §5.4–5.5).
// Both implementations are tested against schemas/grading-cases.json.
import type { Grade, Sector } from './types';

export type GradeInput = {
  reachable: boolean;
  certValid: boolean;
  maxVersion: string;
  defaultPQ: boolean;
  pqOnly: boolean;
  pqAlt: boolean;
  tls13: boolean;
  legacyTLS: boolean;
};

export function computeGrade(i: GradeInput): Grade | null {
  if (!i.reachable) return null;
  if (!i.certValid || i.maxVersion === 'TLS1.1' || i.maxVersion === 'TLS1.0') return 'F';
  if (i.pqOnly && i.defaultPQ) return i.legacyTLS ? 'A' : 'A+';
  if (i.pqOnly || i.pqAlt) return 'B';
  if (i.tls13 || i.maxVersion === 'TLS1.3') return 'C';
  return 'D';
}

/** Default data shelf life in years per sector (§5.3). */
export const SHELF_DEFAULTS: Record<Sector, number> = {
  banking: 10,
  payments: 7,
  government: 25,
  stock_broking: 10,
  insurance: 15,
  healthcare: 25,
  telecom: 5,
  ecommerce: 3,
  education: 5,
  media: 1,
  other: 10,
};

/** Sector sensitivity weights (§5.5). Tune here; the Go scanner mirrors these values. */
export const SECTOR_WEIGHTS: Record<Sector, number> = {
  government: 1.0,
  healthcare: 1.0,
  banking: 0.9,
  insurance: 0.8,
  stock_broking: 0.8,
  payments: 0.8,
  telecom: 0.6,
  education: 0.5,
  ecommerce: 0.4,
  media: 0.2,
  other: 0.5,
};

export function exposure(grade: Grade | null): number {
  switch (grade) {
    case 'A+':
    case 'A':
      return 0;
    case 'B':
      return 0.3;
    case 'C':
    case 'D':
    case 'F':
      return 1;
    default:
      return 0;
  }
}

export const HNDL_FORMULA = 'risk = round(100 × exposure × (0.6 × shelf + 0.4 × sector weight))';

/** Harvest-Now-Decrypt-Later exposure score, 0–100. */
export function hndlRisk(grade: Grade | null, sector: Sector | string, shelfLifeYears: number): number {
  const shelf = Math.max(0, Math.min(1, shelfLifeYears / 25));
  const w = SECTOR_WEIGHTS[sector as Sector] ?? SECTOR_WEIGHTS.other;
  // Same operation order as the Go twin so both produce identical doubles; for
  // non-negative values Math.round and Go's math.Round agree.
  return Math.round(100 * exposure(grade) * (0.6 * shelf + 0.4 * w));
}

export function shelfLife(sector: Sector | string, explicit?: number): number {
  if (explicit && explicit > 0) return explicit;
  return SHELF_DEFAULTS[sector as Sector] ?? SHELF_DEFAULTS.other;
}

export const isQuantumSafe = (g: Grade | null) => g === 'A+' || g === 'A';
