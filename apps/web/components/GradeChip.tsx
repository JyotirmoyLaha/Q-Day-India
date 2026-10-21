import type { Grade } from '@/lib/types';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

/** CSS variable holding each grade's colour (see globals.css). */
export const GRADE_VAR: Record<Grade | 'none', string> = {
  'A+': 'var(--g-aplus)',
  A: 'var(--g-a)',
  B: 'var(--g-b)',
  C: 'var(--g-c)',
  D: 'var(--g-d)',
  F: 'var(--g-f)',
  none: 'var(--g-none)',
};

const SIZES = {
  sm: 'h-8 min-w-8 rounded-lg text-sm',
  md: 'h-11 min-w-11 rounded-xl text-lg',
  lg: 'h-24 min-w-24 rounded-2xl text-5xl',
};

/** A grade letter. The scan date is required: every grade is shown with its date (§10.3). */
export function GradeChip({
  grade,
  date,
  size = 'md',
  showDate = true,
}: {
  grade: Grade | null;
  date: string;
  size?: keyof typeof SIZES;
  showDate?: boolean;
}) {
  const key = grade ?? 'none';
  const label = `Grade ${grade ?? 'not available'}: ${t(`grade.${key}`)}. ${t('scanDate', { date: formatDate(date) })}`;
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span
        role="img"
        aria-label={label}
        title={label}
        style={{ background: GRADE_VAR[key], color: 'var(--chip-fg)' }}
        className={`inline-flex items-center justify-center px-1.5 font-display font-bold tabular-nums shadow-sm ${SIZES[size]}`}
      >
        {grade ?? '—'}
      </span>
      {showDate && <span className="whitespace-nowrap text-[11px] text-muted">{formatDate(date)}</span>}
    </span>
  );
}
