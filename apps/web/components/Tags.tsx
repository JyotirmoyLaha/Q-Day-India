import { t } from '@/lib/i18n';

export function UnverifiedTag() {
  return (
    <span
      title={t('index.unverifiedHelp')}
      className="inline-flex items-center rounded border border-dashed border-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted"
    >
      {t('index.unverified')}
      <span className="sr-only">: {t('index.unverifiedHelp')}</span>
    </span>
  );
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'safe' | 'exposed' | 'danger';
}) {
  const cls = {
    neutral: 'border-line text-muted',
    safe: 'border-accent text-fg bg-accent-soft',
    exposed: 'border-exposed text-fg bg-exposed-soft',
    danger: 'border-danger text-fg bg-danger-soft',
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-card p-5 ${className}`}>{children}</section>;
}
