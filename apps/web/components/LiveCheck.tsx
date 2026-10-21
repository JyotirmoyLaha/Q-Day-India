'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SiteResult } from '@/lib/types';
import { scanRequestURL } from '@/lib/site';
import { SiteReport } from './SiteReport';
import { cleanHost } from './HomeForms';

type State =
  | { phase: 'idle' }
  | { phase: 'loading'; host: string }
  | { phase: 'done'; result: SiteResult; scannedAt: string; cached: boolean; durationMs?: number }
  | { phase: 'unavailable'; host: string; message: string; url: string }
  | { phase: 'error'; host: string; message: string };

export async function fetchLiveScan(host: string, fetchFn: typeof fetch = fetch): Promise<State> {
  try {
    const res = await fetchFn(`/api/scan?host=${encodeURIComponent(host)}`);
    const body = await res.json();
    if (res.ok) return { phase: 'done', result: body.result, scannedAt: body.scannedAt, cached: body.cached, durationMs: body.durationMs };
    if (res.status === 503 || res.status === 429)
      return { phase: 'unavailable', host, message: body.message ?? 'Live scan unavailable.', url: body.requestScanURL ?? scanRequestURL(host) };
    return { phase: 'error', host, message: body.message ?? `Error ${res.status}` };
  } catch {
    return { phase: 'unavailable', host, message: 'The live scanner could not be reached.', url: scanRequestURL(host) };
  }
}

/** Live single-host check used by /check (and the /org report). */
export function LiveCheck({ initialHost, onResult }: { initialHost?: string; onResult?: (r: SiteResult | null, scannedAt?: string) => void }) {
  const [host, setHost] = useState(initialHost ?? '');
  const [state, setState] = useState<State>({ phase: 'idle' });

  async function run(h: string) {
    const clean = cleanHost(h);
    if (!clean) return;
    setState({ phase: 'loading', host: clean });
    const s = await fetchLiveScan(clean);
    setState(s);
    onResult?.(s.phase === 'done' ? s.result : null, s.phase === 'done' ? s.scannedAt : undefined);
  }

  useEffect(() => {
    const q = initialHost ?? new URLSearchParams(window.location.search).get('host');
    if (q) {
      // Prefill from ?host= on mount (SSR-safe only inside an effect).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHost(q);
      void run(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(host);
        }}
        className="flex flex-wrap gap-2"
      >
        <label htmlFor="live-host" className="sr-only">
          Hostname
        </label>
        <input
          id="live-host"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="e.g. onlinesbi.sbi"
          className="min-w-[16rem] flex-1 rounded-lg border border-line bg-card px-4 py-2.5"
          spellCheck={false}
          autoComplete="off"
        />
        <button className="rounded-lg bg-fg px-5 py-2.5 font-medium text-bg disabled:opacity-50" disabled={state.phase === 'loading'}>
          {state.phase === 'loading' ? 'Checking…' : 'Check'}
        </button>
      </form>

      {state.phase === 'loading' && (
        <p aria-live="polite" className="rounded-xl border border-line bg-card p-5 text-sm">
          Running TLS handshakes against <span className="font-mono">{state.host}</span> (takes up to 15 seconds)…
        </p>
      )}
      {state.phase === 'unavailable' && (
        <div role="status" className="rounded-xl border border-exposed bg-exposed-soft p-5">
          <h2 className="font-serif text-xl font-semibold">Live scan unavailable — request a scan</h2>
          <p className="mt-2 text-sm">{state.message}</p>
          <p className="mt-3">
            <a href={state.url} className="font-medium underline">
              Request a scan of {state.host} on GitHub
            </a>{' '}
            <span className="text-sm text-muted">— a workflow runs the scanner and replies on the issue.</span>
          </p>
        </div>
      )}
      {state.phase === 'error' && (
        <p role="alert" className="rounded-xl border border-danger bg-danger-soft p-4 text-sm">
          {state.message}
        </p>
      )}
      {state.phase === 'done' && (
        <>
          <p className="text-sm text-muted">
            {state.cached ? 'Cached result from the last 24 hours.' : `Live result${state.durationMs ? ` in ${(state.durationMs / 1000).toFixed(1)} s` : ''}.`}{' '}
            Not in the weekly index yet? <Link href="/about/scanner" className="underline">How scanning works</Link>
          </p>
          <SiteReport site={state.result} scannedAt={state.scannedAt} live />
        </>
      )}
    </div>
  );
}
