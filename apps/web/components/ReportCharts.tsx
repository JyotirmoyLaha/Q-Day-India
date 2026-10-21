'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--fg)' };
const tick = { fill: 'var(--muted)', fontSize: 12 };

/** Horizontal bars of "% quantum-safe" per category. Pair with a data table (text alternative). */
export function ShareBars({
  data,
  height,
}: {
  data: { label: string; share: number; total: number }[];
  height?: number;
}) {
  return (
    <div style={{ height: height ?? Math.max(160, data.length * 34 + 30) }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={tick} />
          <YAxis type="category" dataKey="label" width={130} tick={tick} />
          <Tooltip
            cursor={{ fill: 'var(--subtle)' }}
            contentStyle={tooltipStyle}
            formatter={(v, _n, item) => [
              `${v}% of ${(item.payload as { total: number }).total} sites`,
              'quantum-safe key exchange',
            ]}
          />
          <Bar dataKey="share" fill="var(--accent)" radius={[0, 3, 3, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="share"
              position="right"
              formatter={(v) => `${v}%`}
              style={{ fill: 'var(--fg)', fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
