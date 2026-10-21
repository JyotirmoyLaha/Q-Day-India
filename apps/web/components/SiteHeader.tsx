'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import { Icon, type IconName } from './Icon';

// The four interactive tools sit behind one "Tools" menu so the bar stays short.
export const TOOLS: { href: string; key: string; desc: string; icon: IconName }[] = [
  { href: '/check', key: 'nav.check', desc: 'nav.toolsDesc.check', icon: 'globe' },
  { href: '/code', key: 'nav.code', desc: 'nav.toolsDesc.code', icon: 'code' },
  { href: '/org', key: 'nav.org', desc: 'nav.toolsDesc.org', icon: 'building' },
  { href: '/qday', key: 'nav.qday', desc: 'nav.toolsDesc.qday', icon: 'clock' },
];

const PAGES = [
  { href: '/report', key: 'nav.report' },
  { href: '/learn', key: 'nav.learn' },
  { href: '/about', key: 'nav.about' },
];

const isActive = (path: string, href: string) =>
  path === href || path.startsWith(`${href}/`) || (href === '/readiness' && path.startsWith('/site/'));

const linkClass = (active: boolean) =>
  `inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-colors ${
    active ? 'bg-subtle text-fg' : 'text-muted hover:text-fg'
  }`;

function ToolsMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const active = TOOLS.some((tool) => isActive(pathname, tool.href));

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <li ref={ref} className="relative">
      <button
        type="button"
        className={linkClass(active || open)}
        aria-expanded={open}
        aria-controls="tools-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {t('nav.tools')}
        <Icon
          name="chevron-down"
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          id="tools-menu"
          className="absolute left-1/2 top-full mt-3 w-80 -translate-x-1/2 rounded-2xl border border-line bg-card p-2 shadow-xl"
        >
          <ul className="grid gap-0.5">
            {TOOLS.map((tool) => {
              const current = isActive(pathname, tool.href);
              return (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    aria-current={current ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-subtle ${
                      current ? 'bg-subtle' : ''
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-bg text-accent">
                      <Icon name={tool.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-fg">{t(tool.key)}</span>
                      <span className="block text-xs leading-snug text-muted">{t(tool.desc)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

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

  const mobileLink = (n: { href: string; key: string }) => (
    <li key={n.href}>
      <Link
        href={n.href}
        onClick={() => setOpen(false)}
        aria-current={isActive(pathname, n.href) ? 'page' : undefined}
        className={`block rounded-lg px-3 py-2.5 font-medium ${
          isActive(pathname, n.href) ? 'bg-subtle text-fg' : 'text-muted hover:bg-subtle hover:text-fg'
        }`}
      >
        {t(n.key)}
      </Link>
    </li>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          <Logo className="h-8 w-8" />
          <span>{t('site.name')}</span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-1 text-sm">
            <li>
              <Link
                href="/readiness"
                aria-current={isActive(pathname, '/readiness') ? 'page' : undefined}
                className={linkClass(isActive(pathname, '/readiness'))}
              >
                {t('nav.index')}
              </Link>
            </li>
            <ToolsMenu pathname={pathname} />
            {PAGES.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} aria-current={active ? 'page' : undefined} className={linkClass(active)}>
                    {t(n.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Link href="/check" className="btn btn-primary hidden !rounded-full !px-4 !py-2 text-sm sm:inline-flex">
            <Icon name="globe" className="h-4 w-4" />
            Check a site
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost !px-2.5 lg:hidden"
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
        <nav id="mobile-nav" aria-label="Main (mobile)" className="border-t border-line bg-bg lg:hidden">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-3 sm:px-6">
            <ul className="grid gap-1">{mobileLink({ href: '/readiness', key: 'nav.index' })}</ul>
            <div>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{t('nav.tools')}</p>
              <ul className="grid gap-1">{TOOLS.map(mobileLink)}</ul>
            </div>
            <ul className="grid gap-1 border-t border-line pt-3">{PAGES.map(mobileLink)}</ul>
          </div>
        </nav>
      )}
    </header>
  );
}
