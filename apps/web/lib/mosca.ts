// Mosca's inequality (§3): if X + Y > Z you are already late.
//   X = years the data must stay secret, Y = years migration takes,
//   Z = years until a cryptographically relevant quantum computer (CRQC).

export type MoscaResult = { late: boolean; years: number; x: number; y: number; z: number };

export function mosca(x: number, y: number, z: number): MoscaResult {
  const gap = x + y - z;
  return { late: gap > 0, years: Math.abs(gap), x, y, z };
}

export function moscaHeadline(r: MoscaResult): string {
  if (r.years === 0) return 'You have no margin left';
  const unit = r.years === 1 ? 'year' : 'years';
  return r.late ? `You are ${r.years} ${unit} late` : `You have ${r.years} ${unit} of margin`;
}

/**
 * Heuristic migration time from the number of quantum-relevant findings in a
 * repository: 1 year baseline, growing with the log of the finding count.
 * Clearly labelled as a heuristic in the UI.
 */
export function migrationYearsFromFindings(highFindings: number): number {
  if (highFindings <= 0) return 1;
  return Math.min(15, Math.round(1 + Math.log2(1 + highFindings) * 0.75));
}

/** Default CRQC estimate (years from now); users can choose their own. */
export const DEFAULT_CRQC_YEARS = 10;
