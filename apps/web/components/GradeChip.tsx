import type { Grade } from '@/lib/types';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

const STYLES: Record<Grade | 'none', string> = {
  'A+': 'bg-accent text-accent-fg border-accent',
  A: 'bg-accent text-accent-fg border-accent',
  B: 'bg-accent-soft text-fg border-accent',
  C: 'bg-exposed-soft text-fg border-exposed',
  D: 'bg-exposed-soft text-fg border-exposed',
  F: 'bg-danger-soft text-fg border-danger',
  none: 'bg-subtle text-muted border-line',
};

const SIZES = {
  sm: 'h-8 min-w-8 text-sm',
  md: 'h-11 min-w-11 text-lg',
  lg: 'h-20 min-w-20 text-4xl',
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
        className={`inline-flex items-center justify-center rounded-lg border-2 px-1.5 font-serif font-bold tabular-nums ${STYLES[key]} ${SIZES[size]}`}
      >
        {grade ?? '—'}
      </span>
      {showDate && <span className="whitespace-nowrap text-[11px] text-muted">{formatDate(date)}</span>}
    </span>
  );
}
