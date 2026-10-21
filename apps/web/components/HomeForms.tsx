'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { t } from '@/lib/i18n';

/** Strips scheme, path and port so "https://www.x.in/login" becomes "www.x.in". */
export function cleanHost(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, '');
  s = s.split(/[/?#]/)[0] ?? '';
  s = s.replace(/:\d+$/, '').replace(/\.$/, '');
  return s;
}

export function HomeForms({ trackedHosts }: { trackedHosts: string[] }) {
  const router = useRouter();
  const [host, setHost] = useState('');
  const [repo, setRepo] = useState('');

  function checkSite(e: React.FormEvent) {
    e.preventDefault();
    const h = cleanHost(host);
    if (!h) return;
    const tracked = new Set(trackedHosts);
    const match = [h, `www.${h}`, h.replace(/^www\./, '')].find((c) => tracked.has(c));
    router.push(match ? `/site/${match}` : `/check?host=${encodeURIComponent(h)}`);
  }

  function scanCode(e: React.FormEvent) {
    e.preventDefault();
    const r = repo.trim();
    router.push(r ? `/code?repo=${encodeURIComponent(r)}` : '/code');
  }

  const input =
    'w-full rounded-lg border border-line bg-card px-4 py-3 text-base placeholder:text-muted focus:border-accent focus:outline-none';
  const button =
    'shrink-0 rounded-lg bg-fg px-5 py-3 font-medium text-bg hover:opacity-90 disabled:opacity-50';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={checkSite} className="rounded-xl border border-line bg-card p-5" aria-labelledby="check-site">
        <h2 id="check-site" className="font-serif text-xl font-semibold">
          {t('home.checkSite')}
        </h2>
        <p className="mt-1 text-sm text-muted">Live TLS check of the public edge: grade, HNDL exposure and fixes.</p>
        <div className="mt-4 flex gap-2">
          <label htmlFor="host" className="sr-only">
            Website hostname
          </label>
          <input
            id="host"
            className={input}
            placeholder={t('home.checkSitePlaceholder')}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
          <button className={button} disabled={!host.trim()}>
            {t('home.checkSiteButton')}
          </button>
        </div>
      </form>
      <form onSubmit={scanCode} className="rounded-xl border border-line bg-card p-5" aria-labelledby="scan-code">
        <h2 id="scan-code" className="font-serif text-xl font-semibold">
          {t('home.scanCode')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('home.scanCodeNote')}</p>
        <div className="mt-4 flex gap-2">
          <label htmlFor="repo" className="sr-only">
            Public GitHub repository URL
          </label>
          <input
            id="repo"
            className={input}
            placeholder={t('home.scanCodePlaceholder')}
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
          />
          <button className={button}>{t('home.scanCodeButton')}</button>
        </div>
      </form>
    </div>
  );
}
