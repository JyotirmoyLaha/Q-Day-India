import type { Grade } from '@/lib/types';
import type { Summary } from '@/lib/data';
import { GRADES } from '@/lib/types';
import { sectorLabel } from '@/lib/i18n';
import { pct } from '@/lib/format';

export const GRADE_FILL: Record<Grade, string> = {
  'A+': 'var(--accent)',
  A: 'color-mix(in srgb, var(--accent) 70%, var(--card))',
  B: 'color-mix(in srgb, var(--accent) 30%, var(--card))',
  C: 'color-mix(in srgb, var(--exposed) 45%, var(--card))',
  D: 'var(--exposed)',
  F: 'var(--danger)',
};

export function GradeLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Grade colours">
      {GRADES.map((g) => (
        <li key={g} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-line" style={{ background: GRADE_FILL[g] }} />
          {g}
        </li>
      ))}
    </ul>
  );
}

/**
 * Stacked 100% bars of grades per sector, rendered as plain HTML so it costs no
 * JavaScript. The data table below is the text alternative.
 */
export function SectorBars({ summary, caption }: { summary: Summary; caption: string }) {
  const rows = [...summary.bySector].sort(
    (a, b) => pct(b.counts['A+'] + b.counts.A, b.total) - pct(a.counts['A+'] + a.counts.A, a.total),
  );
  return (
    <figure>
      <div className="space-y-2.5" aria-hidden="true">
        {rows.map((s) => {
          const safe = pct(s.counts['A+'] + s.counts.A, s.total);
          return (
            <div key={s.sector} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_3.5rem]">
              <span className="truncate text-muted">{sectorLabel(s.sector)}</span>
              <span className="flex h-5 overflow-hidden rounded bg-subtle">
                {GRADES.map((g) =>
                  s.counts[g] ? (
                    <span
                      key={g}
                      style={{ width: `${(100 * s.counts[g]) / s.total}%`, background: GRADE_FILL[g] }}
                      title={`${sectorLabel(s.sector)}: ${s.counts[g]} × ${g}`}
                    />
                  ) : null,
                )}
              </span>
              <span className="text-right font-mono tabular-nums">{safe}%</span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{caption} Right column: share graded A+ or A.</span>
        <GradeLegend />
      </figcaption>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-fg">Show the data as a table</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left text-xs">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-1 pr-2">Sector</th>
                {GRADES.map((g) => (
                  <th key={g} scope="col" className="px-1 py-1 text-right">{g}</th>
                ))}
                <th scope="col" className="px-1 py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.sector} className="border-b border-line/60">
                  <th scope="row" className="py-1 pr-2 font-normal">{sectorLabel(s.sector)}</th>
                  {GRADES.map((g) => (
                    <td key={g} className="px-1 py-1 text-right tabular-nums">{s.counts[g]}</td>
                  ))}
                  <td className="px-1 py-1 text-right tabular-nums">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
