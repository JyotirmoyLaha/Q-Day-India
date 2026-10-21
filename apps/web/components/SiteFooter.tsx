import Link from 'next/link';
import { REPO_URL } from '@/lib/site';
import { t } from '@/lib/i18n';
import { latestScanDate } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { Logo } from './Logo';
import { Icon } from './Icon';

const COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: 'Tools',
    links: [
      { href: '/readiness', label: 'Quantum Readiness Index' },
      { href: '/check', label: 'Check a website' },
      { href: '/code', label: 'Scan your code (QuantumBOM)' },
      { href: '/org', label: 'Organisation report' },
      { href: '/qday', label: 'Q-Day calculator' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/learn', label: 'Post-quantum crypto in 10 minutes' },
      { href: '/report', label: 'State of the Nation report' },
      { href: '/about', label: 'Methodology & limitations' },
      { href: '/about/scanner', label: 'Responsible scanning & opt-out' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: REPO_URL, label: 'Source code on GitHub', external: true },
      { href: `${REPO_URL}/tree/main/data`, label: 'Open data (CC BY 4.0)', external: true },
      { href: `${REPO_URL}/tree/main/action`, label: 'GitHub Action', external: true },
      {
        href: `${REPO_URL}/issues/new?labels=opt-out&title=opt-out:%20`,
        label: 'Request an opt-out',
        external: true,
      },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Logo className="h-8 w-8" />
            {t('site.name')}
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">{t('site.tagline')}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Last weekly scan: {formatDate(latestScanDate())}
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h2 className="text-sm font-semibold">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a
                      href={l.href}
                      className="inline-flex items-center gap-1 text-muted hover:text-fg"
                      rel="noreferrer"
                    >
                      {l.label}
                      <Icon name="external" className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link href={l.href} className="text-muted hover:text-fg">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          Open source · runs for ₹0 on free tiers · grades describe TLS key exchange only, on the date shown,
          and never imply that a site has been compromised.
        </p>
      </div>
    </footer>
  );
}
