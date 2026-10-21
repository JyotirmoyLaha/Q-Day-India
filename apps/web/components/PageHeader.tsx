import type { IconName } from './Icon';
import { Icon } from './Icon';

/** Consistent page heading: eyebrow, title, lead paragraph and optional actions. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  icon,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-line hero-bg px-5 py-8 sm:px-10 sm:py-10">
      {eyebrow && (
        <p className="eyebrow flex items-center gap-2">
          {icon && <Icon name={icon} className="h-4 w-4" />}
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 max-w-4xl font-display text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {lead && <div className="mt-4 max-w-3xl text-base text-muted sm:text-lg">{lead}</div>}
      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}
