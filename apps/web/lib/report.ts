// Monthly "State of the Nation" report (§7.5), computed from compact scan snapshots.
import type { Grade, Sector, Snapshot, SnapshotRow } from './types';
import { GRADES, SECTORS } from './types';
import { isQuantumSafe } from './grading';
import { sectorLabel } from './i18n';
import { formatMonth, pct } from './format';

const SCORE: Record<Grade, number> = { 'A+': 6, A: 5, B: 4, C: 3, D: 2, F: 1 };

export type Mover = { host: string; org: string; sector: Sector; from: Grade; to: Grade; direction: 'up' | 'down' };

export type MonthReport = {
  month: string;
  label: string;
  scanDate: string;
  baselineDate: string | null;
  scansInMonth: number;
  tracked: number;
  reachable: number;
  quantumSafe: number;
  safeShare: number;
  byGrade: Record<Grade, number>;
  sectors: { sector: Sector; label: string; total: number; safe: number; share: number }[];
  movers: Mover[];
  cdn: { behindCdn: number; behindCdnSafe: number; selfHosted: number; selfHostedSafe: number; cdnShare: number; selfShare: number; byProvider: { cdn: string; total: number; safe: number }[] };
  stragglers: { host: string; org: string; sector: Sector; grade: Grade }[];
  legacyCount: number;
  summary: string[];
};

export const reportMonths = (snaps: Snapshot[]) => [...new Set(snaps.map((s) => s.date.slice(0, 7)))].sort();

function gradedRows(s: Snapshot): (SnapshotRow & { g: Grade })[] {
  return s.rows.filter((r): r is SnapshotRow & { g: Grade } => r.g !== null);
}

export function buildMonthReport(snaps: Snapshot[], month: string): MonthReport | null {
  const sorted = [...snaps].sort((a, b) => a.date.localeCompare(b.date));
  const inMonth = sorted.filter((s) => s.date.startsWith(month));
  if (!inMonth.length) return null;
  const latest = inMonth[inMonth.length - 1]!;
  const before = sorted.filter((s) => s.date < `${month}-01`);
  // Movers compare against the last scan before this month, else the first scan of the month.
  const baseline = before.length ? before[before.length - 1]! : inMonth.length > 1 ? inMonth[0]! : null;

  const rows = gradedRows(latest);
  const byGrade = Object.fromEntries(GRADES.map((g) => [g, rows.filter((r) => r.g === g).length])) as Record<Grade, number>;
  const quantumSafe = rows.filter((r) => isQuantumSafe(r.g)).length;

  const sectors = SECTORS.flatMap((s) => {
    const rs = rows.filter((r) => r.s === s);
    if (!rs.length) return [];
    const safe = rs.filter((r) => isQuantumSafe(r.g)).length;
    return [{ sector: s, label: sectorLabel(s), total: rs.length, safe, share: pct(safe, rs.length) }];
  }).sort((a, b) => b.share - a.share || b.total - a.total);

  const movers: Mover[] = [];
  if (baseline) {
    const prev = new Map(gradedRows(baseline).map((r) => [r.h, r.g]));
    for (const r of rows) {
      const p = prev.get(r.h);
      if (p && p !== r.g) movers.push({ host: r.h, org: r.o, sector: r.s, from: p, to: r.g, direction: SCORE[r.g] > SCORE[p] ? 'up' : 'down' });
    }
    movers.sort((a, b) => Math.abs(SCORE[b.to] - SCORE[b.from]) - Math.abs(SCORE[a.to] - SCORE[a.from]) || a.host.localeCompare(b.host));
  }

  const cdnRows = rows.filter((r) => r.cdn);
  const selfRows = rows.filter((r) => !r.cdn);
  const providers = [...new Set(cdnRows.map((r) => r.cdn!))].map((c) => {
    const rs = cdnRows.filter((r) => r.cdn === c);
    return { cdn: c, total: rs.length, safe: rs.filter((r) => isQuantumSafe(r.g)).length };
  }).sort((a, b) => b.total - a.total);
  const cdn = {
    behindCdn: cdnRows.length,
    behindCdnSafe: cdnRows.filter((r) => isQuantumSafe(r.g)).length,
    selfHosted: selfRows.length,
    selfHostedSafe: selfRows.filter((r) => isQuantumSafe(r.g)).length,
    cdnShare: 0,
    selfShare: 0,
    byProvider: providers,
  };
  cdn.cdnShare = pct(cdn.behindCdnSafe, cdn.behindCdn);
  cdn.selfShare = pct(cdn.selfHostedSafe, cdn.selfHosted);

  const legacy = rows.filter((r) => r.leg);
  const stragglers = legacy
    .map((r) => ({ host: r.h, org: r.o, sector: r.s, grade: r.g }))
    .sort((a, b) => SCORE[a.grade] - SCORE[b.grade] || a.host.localeCompare(b.host))
    .slice(0, 15);

  const safeShare = pct(quantumSafe, rows.length);
  const best = sectors[0];
  const worst = sectors[sectors.length - 1];
  const summary: string[] = [
    `${safeShare}% of ${rows.length} reachable Indian sites tracked by Q-Day India used quantum-safe key exchange (grade A or A+) on ${latest.date}.`,
  ];
  if (best && worst && best !== worst)
    summary.push(`${best.label} leads at ${best.share}%; ${worst.label} trails at ${worst.share}%. Sites that are not yet quantum-safe have a migration path today.`);
  if (cdn.behindCdn && cdn.selfHosted)
    summary.push(
      `The CDN effect: ${cdn.cdnShare}% of sites behind a CDN use quantum-safe key exchange, versus ${cdn.selfShare}% of self-hosted sites. Much of India's progress comes from CDN defaults, not from origin servers.`,
    );
  summary.push(
    movers.length
      ? `${movers.filter((m) => m.direction === 'up').length} sites improved their grade and ${movers.filter((m) => m.direction === 'down').length} moved down compared with ${baseline!.date}.`
      : baseline
        ? `No grade changes compared with ${baseline.date}.`
        : 'This is the first scan in the series; biggest movers appear from the next weekly scan.',
  );
  if (legacy.length) summary.push(`${legacy.length} sites (${pct(legacy.length, rows.length)}%) still accept TLS 1.0/1.1, deprecated since 2021.`);

  return {
    month,
    label: formatMonth(month),
    scanDate: latest.date,
    baselineDate: baseline?.date ?? null,
    scansInMonth: inMonth.length,
    tracked: latest.rows.length,
    reachable: rows.length,
    quantumSafe,
    safeShare,
    byGrade,
    sectors,
    movers: movers.slice(0, 20),
    cdn,
    stragglers,
    legacyCount: legacy.length,
    summary,
  };
}
