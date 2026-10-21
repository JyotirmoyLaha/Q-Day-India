'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Grade, HistoryPoint, Sector } from '@/lib/types';
import { GRADES } from '@/lib/types';
import { t, sectorLabel } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import { GradeChip, GRADE_VAR } from './GradeChip';
import { RiskMeter } from './RiskMeter';
import { Sparkline } from './Sparkline';
import { UnverifiedTag, VerifiedTag } from './Tags';
import { Icon } from './Icon';

export type IndexRow = {
  host: string;
  org: string;
  sector: Sector;
  verified: boolean;
  grade: Grade | null;
  hndlRisk: number;
  error?: string;
  history: HistoryPoint[];
};

type Sort = 'risk' | 'host' | 'org' | 'grade';
const PAGE = 50;
const GRADE_ORDER: Record<string, number> = { 'A+': 0, A: 1, B: 2, C: 3, D: 4, F: 5 };

export function filterRows(
  rows: IndexRow[],
  q: string,
  sector: string,
  grade: string,
  sort: Sort,
): IndexRow[] {
  const needle = q.trim().toLowerCase();
  const out = rows.filter(
    (r) =>
      (!needle || r.host.includes(needle) || r.org.toLowerCase().includes(needle)) &&
      (!sector || r.sector === sector) &&
      (!grade || (grade === 'none' ? r.grade === null : r.grade === grade)),
  );
  const cmp: Record<Sort, (a: IndexRow, b: IndexRow) => number> = {
    // Highest exposure first; ungraded hosts last.
    risk: (a, b) =>
      (a.grade === null ? 1 : 0) - (b.grade === null ? 1 : 0) ||
      b.hndlRisk - a.hndlRisk ||
      a.org.localeCompare(b.org),
    grade: (a, b) =>
      (GRADE_ORDER[a.grade ?? ''] ?? 9) - (GRADE_ORDER[b.grade ?? ''] ?? 9) || a.org.localeCompare(b.org),
    host: (a, b) => a.host.localeCompare(b.host),
    org: (a, b) => a.org.localeCompare(b.org) || a.host.localeCompare(b.host),
  };
  return out.sort(cmp[sort]);
}

export function IndexTable({
  rows,
  scannedAt,
  sectors,
}: {
  rows: IndexRow[];
  scannedAt: string;
  sectors: Sector[];
}) {
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [grade, setGrade] = useState('');
  const [sort, setSort] = useState<Sort>('risk');
  const [limit, setLimit] = useState(PAGE);

  // Filters live in the URL (?sector=banking&grade=C&q=sbi) so links from the home page work and views can be shared.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect -- reading the query string on mount */
    if (p.get('q')) setQ(p.get('q')!);
    if (p.get('sector') && sectors.includes(p.get('sector') as Sector)) setSector(p.get('sector')!);
    if (p.get('grade')) setGrade(p.get('grade')!);
    if (p.get('sort')) setSort(p.get('sort') as Sort);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sectors]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (sector) p.set('sector', sector);
    if (grade) p.set('grade', grade);
    if (sort !== 'risk') p.set('sort', sort);
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [q, sector, grade, sort]);

  const filtered = useMemo(() => filterRows(rows, q, sector, grade, sort), [rows, q, sector, grade, sort]);
  const shown = filtered.slice(0, limit);
  const inScope = useMemo(() => filterRows(rows, q, sector, '', 'host'), [rows, q, sector]);
  const counts = Object.fromEntries(
    GRADES.map((g) => [g, inScope.filter((r) => r.grade === g).length]),
  ) as Record<Grade, number>;
  const unreachable = inScope.filter((r) => !r.grade).length;
  const graded = inScope.length - unreachable;
  const reset = () => setLimit(PAGE);

  return (
    <div className="space-y-5">
      {/* grade distribution doubles as the grade filter */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Grade distribution{sector ? ` · ${sectorLabel(sector)}` : ''}
          </p>
          <p className="text-xs text-muted">Click a grade to filter</p>
        </div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
          {GRADES.map((g) =>
            counts[g] ? (
              <span
                key={g}
                style={{
                  width: `${(100 * counts[g]) / Math.max(1, graded)}%`,
                  background: GRADE_VAR[g],
                  opacity: grade && grade !== g ? 0.35 : 1,
                }}
              />
            ) : null,
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by grade">
          <FilterChip active={grade === ''} onClick={() => (setGrade(''), reset())}>
            All grades
          </FilterChip>
          {GRADES.map((g) => (
            <FilterChip
              key={g}
              active={grade === g}
              onClick={() => (setGrade(grade === g ? '' : g), reset())}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: GRADE_VAR[g] }}
                aria-hidden="true"
              />
              {g} <span className="text-muted">{counts[g]}</span>
            </FilterChip>
          ))}
          <FilterChip
            active={grade === 'none'}
            onClick={() => (setGrade(grade === 'none' ? '' : 'none'), reset())}
          >
            Not reachable <span className="text-muted">{unreachable}</span>
          </FilterChip>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{t('index.search')}</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            className="input !pl-9"
            placeholder={t('index.search')}
            value={q}
            onChange={(e) => (setQ(e.target.value), reset())}
          />
        </label>
        <label className="lg:w-72">
          <span className="sr-only">Sort</span>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="risk">{t('index.sortRisk')}</option>
            <option value="grade">Sort by grade (best first)</option>
            <option value="org">{t('index.sortOrg')}</option>
            <option value="host">{t('index.sortHost')}</option>
          </select>
        </label>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by sector">
        <div className="flex gap-2 pb-1">
          <FilterChip active={sector === ''} onClick={() => (setSector(''), reset())}>
            {t('index.allSectors')}
          </FilterChip>
          {sectors.map((s) => (
            <FilterChip
              key={s}
              active={sector === s}
              onClick={() => (setSector(sector === s ? '' : s), reset())}
            >
              {sectorLabel(s)}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {t('index.showing', { count: filtered.length, total: rows.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t('index.noResults')}</p>
      ) : (
        <>
          {/* desktop: table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">
                {t('index.title')}: {t('index.showing', { count: shown.length, total: rows.length })}
              </caption>
              <thead className="border-b border-line bg-subtle/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t('index.colSite')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    {t('index.colSector')}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">
                    {t('index.colGrade')}
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    {t('index.colRisk')}
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    {t('index.colHistory')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => (
                  <tr key={r.host} className="transition-colors hover:bg-subtle/50">
                    <th scope="row" className="px-5 py-3 text-left font-normal">
                      <Link href={`/site/${r.host}`} className="font-semibold hover:text-accent">
                        {r.org}
                      </Link>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-mono">{r.host}</span>
                        {r.verified ? <VerifiedTag /> : <UnverifiedTag />}
                      </span>
                    </th>
                    <td className="px-3 py-3 text-muted">{sectorLabel(r.sector)}</td>
                    <td className="px-3 py-3 text-center">
                      <GradeChip grade={r.grade} date={scannedAt} size="sm" showDate={false} />
                    </td>
                    <td className="px-3 py-3">
                      {r.grade ? (
                        <RiskMeter risk={r.hndlRisk} />
                      ) : (
                        <span className="text-xs text-muted">{r.error ? t(`errors.${r.error}`) : '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Sparkline history={r.history} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile: cards */}
          <ul className="space-y-3 md:hidden" aria-label={t('index.title')}>
            {shown.map((r) => (
              <li key={r.host}>
                <Link href={`/site/${r.host}`} className="card flex items-center gap-4 p-4">
                  <GradeChip grade={r.grade} date={scannedAt} size="md" showDate={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.org}</span>
                    <span className="block truncate font-mono text-xs text-muted">{r.host}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {sectorLabel(r.sector)}
                      {r.grade ? (
                        <span>· HNDL {r.hndlRisk}/100</span>
                      ) : (
                        <span>· {r.error ? t(`errors.${r.error}`) : 'not graded'}</span>
                      )}
                      {!r.verified && <UnverifiedTag />}
                    </span>
                  </span>
                  <Icon name="arrow-right" className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Grades as of {formatDate(scannedAt)}.</p>
        </>
      )}

      {filtered.length > limit && (
        <div className="text-center">
          <button type="button" className="btn btn-secondary" onClick={() => setLimit((l) => l + PAGE * 2)}>
            Show more ({filtered.length - limit} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-accent bg-accent-soft text-fg'
          : 'border-line bg-card text-muted hover:border-accent hover:text-fg'
      }`}
    >
      {children}
    </button>
  );
}
