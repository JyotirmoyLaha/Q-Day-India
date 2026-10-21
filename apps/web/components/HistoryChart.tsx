'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Grade, HistoryPoint } from '@/lib/types';
import { formatDate } from '@/lib/format';

const SCORE: Record<Grade, number> = { 'A+': 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
const LABEL: Record<number, string> = { 6: 'A+', 5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'F' };

/** Grade over time. A text list is always rendered as the accessible alternative. */
export function HistoryChart({ history }: { history: HistoryPoint[] }) {
  const data = history
    .filter((h) => h.grade)
    .map((h) => ({ date: formatDate(h.date), score: SCORE[h.grade as Grade], risk: h.risk }));
  return (
    <figure>
      {data.length >= 2 ? (
        <div className="h-48 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis
                domain={[1, 6]}
                ticks={[1, 2, 3, 4, 5, 6]}
                tickFormatter={(v: number) => LABEL[v] ?? ''}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
              />
              <Tooltip
                formatter={(v) => [LABEL[Number(v)] ?? String(v), 'Grade']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--fg)' }}
              />
              <Line type="stepAfter" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
          History builds up week by week. A trend line appears after the second weekly scan.
        </p>
      )}
      <figcaption className="mt-2 text-xs text-muted">
        {data.length ? `Grade by scan date: ${data.map((d) => `${d.date}: ${LABEL[d.score]}`).join(' · ')}` : 'No graded scans yet.'}
      </figcaption>
    </figure>
  );
}
