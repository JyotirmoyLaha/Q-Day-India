import { t } from '@/lib/i18n';
import { Icon } from './Icon';

export function UnverifiedTag() {
  return (
    <span
      title={t('index.unverifiedHelp')}
      className="inline-flex items-center rounded-md border border-dashed border-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
    >
      {t('index.unverified')}
      <span className="sr-only">: {t('index.unverifiedHelp')}</span>
    </span>
  );
}

export function VerifiedTag() {
  return (
    <span
      title="Hostname confirmed to belong to this organisation"
      className="inline-flex items-center gap-0.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg"
    >
      <Icon name="check" className="h-3 w-3" />
      verified
    </span>
  );
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'safe' | 'exposed' | 'danger' | 'info';
}) {
  const cls = {
    neutral: 'border-line text-muted',
    safe: 'border-transparent text-fg bg-accent-soft',
    exposed: 'border-transparent text-fg bg-exposed-soft',
    danger: 'border-transparent text-fg bg-danger-soft',
    info: 'border-transparent text-fg bg-info-soft',
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function CardTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: Parameters<typeof Icon>[0]['name'];
}) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      {icon && (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-subtle text-accent">
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
      )}
      {children}
    </h2>
  );
}
