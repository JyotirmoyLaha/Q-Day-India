import Link from 'next/link';
import { t } from '@/lib/i18n';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';

const NAV = [
  { href: '/index', key: 'nav.index' },
  { href: '/code', key: 'nav.code' },
  { href: '/org', key: 'nav.org' },
  { href: '/qday', key: 'nav.qday' },
  { href: '/report', key: 'nav.report' },
  { href: '/learn', key: 'nav.learn' },
  { href: '/about', key: 'nav.about' },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
          <Logo className="h-7 w-7" />
          <span>{t('site.name')}</span>
        </Link>
        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="rounded-md px-2.5 py-1.5 text-muted hover:bg-subtle hover:text-fg"
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto lg:ml-0">
          <ThemeToggle />
        </div>
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none rounded-md border border-line px-3 py-1.5 text-sm [&::-webkit-details-marker]:hidden">
            {t('nav.menu')}
          </summary>
          <nav
            aria-label="Main (mobile)"
            className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-line bg-card p-2 shadow-lg"
          >
            <ul className="text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="block rounded px-3 py-2 hover:bg-subtle">
                    {t(n.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
