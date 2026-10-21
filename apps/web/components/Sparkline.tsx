import type { Grade, HistoryPoint } from '@/lib/types';
import { formatDate } from '@/lib/format';

const SCORE: Record<Grade, number> = { 'A+': 6, A: 5, B: 4, C: 3, D: 2, F: 1 };

/** Tiny grade-history line (A+ at the top, F at the bottom). */
export function Sparkline({
  history,
  width = 84,
  height = 22,
}: {
  history: HistoryPoint[];
  width?: number;
  height?: number;
}) {
  const pts = history.filter((h): h is HistoryPoint & { grade: Grade } => h.grade !== null);
  if (pts.length === 0) return <span className="text-xs text-muted">—</span>;
  const desc = `Grade history: ${pts.map((p) => `${p.grade} on ${formatDate(p.date)}`).join(', ')}`;
  const x = (i: number) => (pts.length === 1 ? width / 2 : 3 + (i * (width - 6)) / (pts.length - 1));
  const y = (g: Grade) => height - 3 - ((SCORE[g] - 1) / 5) * (height - 6);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.grade).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1]!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={desc}>
      <title>{desc}</title>
      <line x1="0" x2={width} y1={y('A')} y2={y('A')} stroke="var(--line)" strokeDasharray="2 3" />
      {pts.length > 1 && <path d={d} fill="none" stroke="var(--muted)" strokeWidth="1.5" />}
      <circle
        cx={x(pts.length - 1)}
        cy={y(last.grade)}
        r="2.6"
        fill={SCORE[last.grade] >= 5 ? 'var(--accent)' : 'var(--exposed)'}
      />
    </svg>
  );
}
