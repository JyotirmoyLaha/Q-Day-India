import { t } from '@/lib/i18n';
import { HNDL_FORMULA } from '@/lib/grading';

/** HNDL exposure 0–100 as a number and a bar, with the formula in the tooltip. */
export function RiskMeter({
  risk,
  graded = true,
  compact = false,
}: {
  risk: number;
  graded?: boolean;
  compact?: boolean;
}) {
  if (!graded) return <span className="text-muted">—</span>;
  const tone = risk === 0 ? 'bg-accent' : risk < 40 ? 'bg-exposed/60' : 'bg-exposed';
  const help = `${t('hndl.label')}: ${risk}/100. ${t('hndl.help')} ${HNDL_FORMULA}.`;
  return (
    <span className="inline-flex items-center gap-2" title={help}>
      <span className="w-8 text-right font-mono text-sm tabular-nums" aria-hidden="true">
        {risk}
      </span>
      {!compact && (
        <span className="h-2 w-20 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
          <span className={`block h-full ${tone}`} style={{ width: `${Math.max(risk, 2)}%` }} />
        </span>
      )}
      <span className="sr-only">{help}</span>
    </span>
  );
}
