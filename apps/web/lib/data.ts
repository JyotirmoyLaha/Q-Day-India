// Build-time data access. Everything here comes from generated/*.json, which
// scripts/prebuild.mjs compiles from data/ — no filesystem access at runtime.
import latestJSON from '@/generated/latest.json';
import historyJSON from '@/generated/history.json';
import type { Grade, ScanFile, Sector, SiteResult, SiteWithHistory, Snapshot } from './types';
import { GRADES, SECTORS } from './types';
import { isQuantumSafe } from './grading';

const latest = latestJSON as unknown as ScanFile;
const snapshots = (historyJSON as unknown as { snapshots: Snapshot[] }).snapshots;

/** Unverified hosts are shown with a tag unless NEXT_PUBLIC_SHOW_UNVERIFIED=0 (DECISIONS.md #2). */
export const SHOW_UNVERIFIED = process.env.NEXT_PUBLIC_SHOW_UNVERIFIED !== '0';

const visible = (r: { verified: boolean }) => SHOW_UNVERIFIED || r.verified;

export function getLatest(): ScanFile {
  return { ...latest, results: latest.results.filter(visible) };
}

export const latestScanDate = () => latest.scannedAt;

export function getSnapshots(): Snapshot[] {
  return snapshots.map((s) => ({ ...s, rows: s.rows.filter((r) => SHOW_UNVERIFIED || r.v) }));
}

export function historyFor(host: string) {
  return snapshots.flatMap((s) => {
    const row = s.rows.find((r) => r.h === host);
    return row ? [{ date: s.date, grade: row.g, risk: row.r }] : [];
  });
}

export function getSites(): SiteWithHistory[] {
  return getLatest().results.map((r) => ({ ...r, history: historyFor(r.host), scannedAt: latest.scannedAt }));
}

export function getSite(host: string): SiteWithHistory | undefined {
  return getSites().find((s) => s.host === host);
}

export type Summary = {
  tracked: number;
  reachable: number;
  quantumSafe: number;
  exposed: number;
  legacy: number;
  byGrade: Record<Grade, number>;
  bySector: { sector: Sector; total: number; counts: Record<Grade, number> }[];
};

export function summarise(results: SiteResult[]): Summary {
  const zero = () => Object.fromEntries(GRADES.map((g) => [g, 0])) as Record<Grade, number>;
  const byGrade = zero();
  const sectors = new Map<Sector, { sector: Sector; total: number; counts: Record<Grade, number> }>();
  let reachable = 0;
  let quantumSafe = 0;
  let legacy = 0;
  for (const r of results) {
    if (!r.grade) continue;
    reachable++;
    byGrade[r.grade]++;
    if (isQuantumSafe(r.grade)) quantumSafe++;
    if (r.tls?.legacyEnabled) legacy++;
    const s = sectors.get(r.sector) ?? { sector: r.sector, total: 0, counts: zero() };
    s.total++;
    s.counts[r.grade]++;
    sectors.set(r.sector, s);
  }
  const exposed = byGrade.C + byGrade.D + byGrade.F;
  const bySector = SECTORS.flatMap((s) => (sectors.has(s) ? [sectors.get(s)!] : []));
  return { tracked: results.length, reachable, quantumSafe, exposed, legacy, byGrade, bySector };
}
