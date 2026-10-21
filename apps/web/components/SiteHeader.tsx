'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { t } from '@/lib/i18n';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { Icon } from './Icon';

export const NAV = [
  { href: '/readiness', key: 'nav.index' },
  { href: '/code', key: 'nav.code' },
  { href: '/org', key: 'nav.org' },
  { href: '/qday', key: 'nav.qday' },
  { href: '/report', key: 'nav.report' },
  { href: '/learn', key: 'nav.learn' },
  { href: '/about', key: 'nav.about' },
];

const isActive = (path: string, href: string) =>
  path === href || path.startsWith(`${href}/`) || (href === '/readiness' && path.startsWith('/site/'));

export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <Logo className="h-8 w-8" />
          <span>{t('site.name')}</span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden flex-1 xl:block">
          <ul className="flex items-center gap-0.5 text-sm">
            {NAV.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative whitespace-nowrap rounded-lg px-2.5 py-2 font-medium transition-colors ${
                      active ? 'text-fg' : 'text-muted hover:bg-subtle hover:text-fg'
                    }`}
                  >
                    {t(n.key)}
                    {/* Always rendered (only the opacity changes) so server and client HTML match on every route. */}
                    <span
                      className={`absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/check" className="btn btn-secondary hidden !py-2 text-sm sm:inline-flex">
            <Icon name="globe" className="h-4 w-4" />
            Check a site
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost !px-2.5 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : t('nav.menu')}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main (mobile)" className="border-t border-line bg-bg xl:hidden">
          <ul className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:px-6">
            {[...NAV, { href: '/check', key: 'nav.check' }].map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, n.href) ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2.5 font-medium ${
                    isActive(pathname, n.href)
                      ? 'bg-subtle text-fg'
                      : 'text-muted hover:bg-subtle hover:text-fg'
                  }`}
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
