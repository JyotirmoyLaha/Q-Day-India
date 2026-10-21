'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import { Icon } from './Icon';

/** Strips scheme, path and port so "https://www.x.in/login" becomes "www.x.in". */
export function cleanHost(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, '');
  s = s.split(/[/?#]/)[0] ?? '';
  s = s.replace(/:\d+$/, '').replace(/\.$/, '');
  return s;
}

type Tab = 'site' | 'code';

const EXAMPLE_REPOS = ['auth0/node-jsonwebtoken', 'golang/crypto'];

/** Hero actions: check a website (weekly data or live scan) or scan a repository. */
export function HomeForms({ trackedHosts, examples = [] }: { trackedHosts: string[]; examples?: string[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('site');
  const [host, setHost] = useState('');
  const [hint, setHint] = useState('');
  const [repo, setRepo] = useState('');

  function goSite(raw: string) {
    const h = cleanHost(raw);
    if (!h) {
      setHint('Enter a hostname first, for example onlinesbi.sbi.bank.in');
      document.getElementById('host')?.focus();
      return;
    }
    setHint('');
    const tracked = new Set(trackedHosts);
    const bare = h.replace(/^www\./, '');
    const match = [h, `www.${bare}`, bare].find((c) => tracked.has(c));
    router.push(match ? `/site/${match}` : `/check?host=${encodeURIComponent(h)}`);
  }

  function goCode(raw: string) {
    const r = raw.trim();
    router.push(r ? `/code?repo=${encodeURIComponent(r)}` : '/code');
  }

  const tabBtn = (id: Tab, label: string, icon: 'globe' | 'code') => (
    <button
      type="button"
      role="tab"
      id={`hero-tab-${id}`}
      aria-selected={tab === id}
      aria-controls={`hero-panel-${id}`}
      onClick={() => setTab(id)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
        tab === id ? 'bg-card text-fg shadow-sm' : 'text-muted hover:text-fg'
      }`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="card p-2 sm:p-3">
      <div
        role="tablist"
        aria-label="What do you want to check?"
        className="flex gap-1 rounded-2xl bg-subtle p-1"
      >
        {tabBtn('site', t('home.checkSite'), 'globe')}
        {tabBtn('code', t('home.scanCode'), 'code')}
      </div>

      {tab === 'site' ? (
        <div role="tabpanel" id="hero-panel-site" aria-labelledby="hero-tab-site" className="p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goSite(host);
            }}
          >
            <label htmlFor="host" className="text-sm font-medium">
              Website hostname
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="host"
                className="input"
                placeholder={t('home.checkSitePlaceholder')}
                value={host}
                onChange={(e) => setHost(e.target.value)}
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
              />
              <button className="btn btn-primary sm:px-6">
                <Icon name="search" className="h-4 w-4" />
                {t('home.checkSiteButton')}
              </button>
            </div>
            {hint && (
              <p role="alert" className="mt-2 text-sm text-exposed">
                {hint}
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Tracked sites open their weekly report instantly; anything else gets a live TLS check (about 2
              seconds).
            </p>
            {examples.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted">Try:</span>
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => goSite(ex)}
                    className="rounded-full border border-line px-2.5 py-1 font-mono hover:border-accent hover:text-accent"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      ) : (
        <div role="tabpanel" id="hero-panel-code" aria-labelledby="hero-tab-code" className="p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goCode(repo);
            }}
          >
            <label htmlFor="repo" className="text-sm font-medium">
              Public GitHub repository
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="repo"
                className="input"
                placeholder={t('home.scanCodePlaceholder')}
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
              />
              <button className="btn btn-primary sm:px-6">
                <Icon name="zap" className="h-4 w-4" />
                {t('home.scanCodeButton')}
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <Icon name="lock" className="h-3.5 w-3.5" />
              {t('home.scanCodeNote')} Private code? Upload a zip on the next page.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">Try:</span>
              {EXAMPLE_REPOS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => goCode(`https://github.com/${ex}`)}
                  className="rounded-full border border-line px-2.5 py-1 font-mono hover:border-accent hover:text-accent"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
