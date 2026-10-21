// Repository scores (§6.5). Formulas are documented on /about#code; keep both in sync.
import type { Confidence, Finding, Primitive, QuantumRisk, Scores } from './types';

export const RISK_WEIGHTS: { HIGH: Partial<Record<Primitive, number>> & { default: number }; CLASSICAL_BROKEN: number; LOW: number; NONE: number } = {
  // Key agreement / KEM protect data in transit (harvest-now-decrypt-later) and
  // long-lived signatures/keys anchor trust for years, so they weigh most.
  HIGH: { 'key-agreement': 10, kem: 10, pke: 8, signature: 8, default: 6 },
  CLASSICAL_BROKEN: 3,
  LOW: 1,
  NONE: 0,
};

export const CONFIDENCE_FACTOR: Record<Confidence, number> = { high: 1, medium: 0.7, low: 0.4 };

export function findingWeight(f: Pick<Finding, 'quantumRisk' | 'primitive' | 'confidence'>): number {
  const base =
    f.quantumRisk === 'HIGH' ? (RISK_WEIGHTS.HIGH[f.primitive] ?? RISK_WEIGHTS.HIGH.default) : RISK_WEIGHTS[f.quantumRisk as Exclude<QuantumRisk, 'HIGH'>];
  return base * CONFIDENCE_FACTOR[f.confidence];
}

/** Quantum Exposure 0–100: weighted findings normalised by repo size on a log curve. */
export function exposureScore(findings: Finding[], filesScanned: number): { score: number; weighted: number; scale: number } {
  const weighted = findings.reduce((s, f) => s + findingWeight(f), 0);
  const scale = 6 * Math.log2(2 + Math.max(0, filesScanned));
  const score = Math.round(100 * (1 - Math.exp(-weighted / scale)));
  return { score, weighted: Math.round(weighted * 10) / 10, scale: Math.round(scale * 10) / 10 };
}

/** Crypto-Agility 0–100: high when hardcoded algorithm choices live in few files. */
export function agilityScore(findings: Finding[]): { score: number; hardcoded: number; files: number } {
  const hard = findings.filter((f) => (f.kind === 'treesitter' || f.kind === 'regex') && f.quantumRisk !== 'NONE');
  const files = new Set(hard.map((f) => f.file)).size;
  if (hard.length === 0) return { score: 100, hardcoded: 0, files: 0 };
  const score = Math.round(100 * Math.max(0, Math.min(1, 1 - (files - 1) / hard.length)));
  return { score, hardcoded: hard.length, files };
}

export function computeScores(findings: Finding[], filesScanned: number): Scores {
  const e = exposureScore(findings, filesScanned);
  const a = agilityScore(findings);
  const count = (pred: (f: Finding) => boolean) => findings.filter(pred).length;
  return {
    exposure: e.score,
    agility: a.score,
    exposureInputs: [
      { label: 'HIGH (Shor) key agreement / KEM', value: count((f) => f.quantumRisk === 'HIGH' && (f.primitive === 'key-agreement' || f.primitive === 'kem')) },
      { label: 'HIGH (Shor) public-key encryption', value: count((f) => f.quantumRisk === 'HIGH' && f.primitive === 'pke') },
      { label: 'HIGH (Shor) signatures', value: count((f) => f.quantumRisk === 'HIGH' && f.primitive === 'signature') },
      { label: 'Classically broken (MD5, SHA-1, DES, RC4, short RSA…)', value: count((f) => f.quantumRisk === 'CLASSICAL_BROKEN') },
      { label: 'LOW (Grover) — e.g. AES-128', value: count((f) => f.quantumRisk === 'LOW') },
      { label: 'Confidence-weighted sum', value: e.weighted },
      { label: 'Files analysed', value: filesScanned },
      { label: 'Size scale 6 × log2(2 + files)', value: e.scale },
    ],
    agilityInputs: [
      { label: 'Hardcoded algorithm choices (code + config findings)', value: a.hardcoded },
      { label: 'Distinct files containing them', value: a.files },
      { label: 'Formula', value: '100 × (1 − (files − 1) / hardcoded)' },
    ],
  };
}
