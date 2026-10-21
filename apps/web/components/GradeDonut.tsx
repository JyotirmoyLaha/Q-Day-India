import type { Grade } from '@/lib/types';
import { GRADES } from '@/lib/types';
import { GRADE_VAR } from './GradeChip';

/** Donut of the grade distribution with the quantum-safe share in the middle. */
export function GradeDonut({
  byGrade,
  total,
  centerValue,
  centerLabel,
}: {
  byGrade: Record<Grade, number>;
  total: number;
  centerValue: string;
  centerLabel: string;
}) {
  const r = 70;
  const c = 2 * Math.PI * r;
  // Segment lengths and their start offsets along the circle, computed up front.
  const lens = GRADES.map((g) => (total ? (byGrade[g] / total) * c : 0));
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  const desc = GRADES.map((g) => `${g}: ${byGrade[g]}`).join(', ');
  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox="0 0 180 180"
        className="h-56 w-56"
        role="img"
        aria-label={`Grade distribution of ${total} reachable sites — ${desc}`}
      >
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--subtle)" strokeWidth="22" />
        {GRADES.map((g, i) => {
          const len = lens[i]!;
          return len ? (
            <circle
              key={g}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke={GRADE_VAR[g]}
              strokeWidth="22"
              strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`}
              strokeDashoffset={-starts[i]!}
              transform="rotate(-90 90 90)"
            />
          ) : null;
        })}
        <text
          x="90"
          y="88"
          textAnchor="middle"
          fontSize="34"
          fontWeight="700"
          fill="var(--fg)"
          fontFamily="var(--nf-display)"
        >
          {centerValue}
        </text>
        <text x="90" y="110" textAnchor="middle" fontSize="11" fill="var(--muted)">
          {centerLabel}
        </text>
      </svg>
      <figcaption>
        <ul
          className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted"
          aria-label="Grade legend"
        >
          {GRADES.map((g) => (
            <li key={g} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GRADE_VAR[g] }} />
              <span className="font-semibold text-fg">{g}</span> {byGrade[g]}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
