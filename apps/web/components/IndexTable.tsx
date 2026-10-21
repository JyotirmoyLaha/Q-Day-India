'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Grade, HistoryPoint, Sector } from '@/lib/types';
import { GRADES } from '@/lib/types';
import { t, sectorLabel } from '@/lib/i18n';
import { GradeChip } from './GradeChip';
import { RiskMeter } from './RiskMeter';
import { Sparkline } from './Sparkline';
import { UnverifiedTag } from './Tags';

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

type Sort = 'risk' | 'host' | 'org';
const PAGE = 50;

export function filterRows(rows: IndexRow[], q: string, sector: string, grade: string, sort: Sort): IndexRow[] {
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
      (a.grade === null ? 1 : 0) - (b.grade === null ? 1 : 0) || b.hndlRisk - a.hndlRisk || a.host.localeCompare(b.host),
    host: (a, b) => a.host.localeCompare(b.host),
    org: (a, b) => a.org.localeCompare(b.org) || a.host.localeCompare(b.host),
  };
  return out.sort(cmp[sort]);
}

export function IndexTable({ rows, scannedAt, sectors }: { rows: IndexRow[]; scannedAt: string; sectors: Sector[] }) {
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [grade, setGrade] = useState('');
  const [sort, setSort] = useState<Sort>('risk');
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => filterRows(rows, q, sector, grade, sort), [rows, q, sector, grade, sort]);
  const shown = filtered.slice(0, limit);
  const control = 'rounded-lg border border-line bg-card px-3 py-2 text-sm';

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="search">
        <label className="min-w-[14rem] flex-1">
          <span className="sr-only">{t('index.search')}</span>
          <input
            type="search"
            className={`${control} w-full`}
            placeholder={t('index.search')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Sector</span>
          <select className={control} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">{t('index.allSectors')}</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {sectorLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Grade</span>
          <select className={control} value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">{t('index.allGrades')}</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
            <option value="none">Not reachable</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select className={control} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="risk">{t('index.sortRisk')}</option>
            <option value="org">{t('index.sortOrg')}</option>
            <option value="host">{t('index.sortHost')}</option>
          </select>
        </label>
      </div>

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {t('index.showing', { count: filtered.length, total: rows.length })}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-6 text-center text-muted">{t('index.noResults')}</p>
      ) : (
        <table className="mt-3 block w-full text-sm md:table">
          <caption className="sr-only">
            {t('index.title')}: {t('index.showing', { count: shown.length, total: rows.length })}
          </caption>
          <thead className="hidden border-b border-line text-left text-xs uppercase tracking-wide text-muted md:table-header-group">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">{t('index.colSite')}</th>
              <th scope="col" className="px-3 py-2 font-medium">{t('index.colSector')}</th>
              <th scope="col" className="px-3 py-2 text-center font-medium">{t('index.colGrade')}</th>
              <th scope="col" className="px-3 py-2 font-medium">{t('index.colRisk')}</th>
              <th scope="col" className="px-3 py-2 font-medium">{t('index.colHistory')}</th>
            </tr>
          </thead>
          <tbody className="block space-y-3 md:table-row-group md:space-y-0">
            {shown.map((r) => (
              <tr
                key={r.host}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 rounded-xl border border-line bg-card p-4 md:table-row md:rounded-none md:border-0 md:border-b md:bg-transparent md:p-0"
              >
                <th scope="row" className="col-start-1 text-left font-normal md:py-3 md:pr-3">
                  <Link href={`/site/${r.host}`} className="font-medium hover:text-accent hover:underline">
                    {r.org}
                  </Link>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-mono">{r.host}</span>
                    {!r.verified && <UnverifiedTag />}
                  </span>
                </th>
                <td className="col-start-1 text-muted md:px-3 md:py-3">
                  <span className="md:hidden">Sector: </span>
                  {sectorLabel(r.sector)}
                </td>
                <td className="col-start-2 row-span-2 row-start-1 md:px-3 md:py-3 md:text-center">
                  <GradeChip grade={r.grade} date={scannedAt} size="sm" />
                </td>
                <td className="col-start-1 md:px-3 md:py-3">
                  <span className="mr-2 text-xs text-muted md:hidden">HNDL exposure</span>
                  {r.grade ? (
                    <RiskMeter risk={r.hndlRisk} />
                  ) : (
                    <span className="text-xs text-muted">{r.error ? t(`errors.${r.error}`) : '—'}</span>
                  )}
                </td>
                <td className="col-start-2 md:px-3 md:py-3">
                  <Sparkline history={r.history} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {filtered.length > limit && (
        <div className="mt-6 text-center">
          <button
            type="button"
            className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent"
            onClick={() => setLimit((l) => l + PAGE * 2)}
          >
            Show more ({filtered.length - limit} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
