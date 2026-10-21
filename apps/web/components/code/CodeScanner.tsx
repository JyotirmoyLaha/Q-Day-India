'use client';

import { useEffect, useRef, useState } from 'react';
import { PASTE_LANGUAGES } from '@/lib/sources';
import { decodeReport } from '@/lib/share';
import { useQuantumScan, type ScanInput } from '@/lib/useQuantumScan';
import { CodeResults, RISK_META } from './CodeResults';

type Tab = 'github' | 'zip' | 'paste';

const SAMPLE = `from cryptography.hazmat.primitives.asymmetric import rsa
import hashlib, jwt

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
digest = hashlib.md5(b"payload").hexdigest()
token = jwt.encode({"sub": "42"}, private_pem, algorithm="RS256")
`;

/** Input tabs → worker scan → streamed progress → results. Optional onReport for /org. */
export function CodeScanner({ onReport }: { onReport?: (r: import("@qday/cbom-engine").ScanReport | null) => void }) {
  const { state, start, cancel, showReport } = useQuantumScan();
  const [tab, setTab] = useState<Tab>('github');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [zip, setZip] = useState<File | null>(null);
  const [paste, setPaste] = useState(SAMPLE);
  const [lang, setLang] = useState(PASTE_LANGUAGES[0]!.file);
  const [shared, setShared] = useState(false);
  const autoStarted = useRef(false);

  // Shared report in the fragment, or ?repo= prefill from the home page.
  useEffect(() => {
    if (window.location.hash.startsWith('#r=')) {
      const r = decodeReport(window.location.hash);
      if (r) {
        // Reading the URL fragment on mount is SSR-safe only inside an effect.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShared(true);
        showReport(r);
        return;
      }
    }
    const repo = new URLSearchParams(window.location.search).get('repo');
    if (repo && !autoStarted.current) {
      autoStarted.current = true;
       
      setUrl(repo);
      start({ kind: 'github', url: repo });
    }
  }, [showReport, start]);

  useEffect(() => {
    if (onReport) onReport(state.phase === 'done' ? state.report : null);
  }, [state, onReport]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setShared(false);
    let input: ScanInput;
    if (tab === 'github') input = { kind: 'github', url, token: token || undefined };
    else if (tab === 'zip') {
      if (!zip) return;
      input = { kind: 'zip', name: zip.name, data: await zip.arrayBuffer() };
    } else input = { kind: 'paste', name: lang, content: paste };
    start(input);
  }

  const running = state.phase === 'running';
  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      id={`tab-${t}`}
      aria-selected={tab === t}
      aria-controls={`panel-${t}`}
      onClick={() => setTab(t)}
      className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'}`}
    >
      {label}
    </button>
  );
  const field = 'w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm focus:border-accent focus:outline-none';

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="rounded-xl border border-line bg-card p-5" aria-label="Choose code to scan">
        <div role="tablist" aria-label="Input" className="flex flex-wrap gap-1 border-b border-line">
          {tabBtn('github', 'Public GitHub repo')}
          {tabBtn('zip', 'Upload a zip')}
          {tabBtn('paste', 'Paste code')}
        </div>

        <div className="pt-4">
          {tab === 'github' && (
            <div role="tabpanel" id="panel-github" aria-labelledby="tab-github" className="space-y-3">
              <label className="block text-sm font-medium" htmlFor="repo-url">
                Repository URL
              </label>
              <input id="repo-url" className={field} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repo" required spellCheck={false} autoComplete="off" />
              <details className="text-sm">
                <summary className="cursor-pointer text-muted hover:text-fg">Optional: GitHub token for higher rate limits</summary>
                <label className="mt-2 block text-sm" htmlFor="gh-token">
                  Token (held in memory only; sent only to api.github.com, never stored)
                </label>
                <input id="gh-token" type="password" className={`${field} mt-1`} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" spellCheck={false} />
              </details>
              <p className="text-xs text-muted">
                Your browser calls the GitHub API for the file list (3 requests) and downloads relevant files from
                raw.githubusercontent.com. No other server sees the code.
              </p>
            </div>
          )}
          {tab === 'zip' && (
            <div role="tabpanel" id="panel-zip" aria-labelledby="tab-zip" className="space-y-3">
              <label className="block text-sm font-medium" htmlFor="zip-file">
                Zip archive of your code
              </label>
              <input id="zip-file" type="file" accept=".zip,application/zip" className={field} onChange={(e) => setZip(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted">Unzipped and analysed entirely inside this browser tab. Nothing is uploaded, so private code is safe here.</p>
            </div>
          )}
          {tab === 'paste' && (
            <div role="tabpanel" id="panel-paste" aria-labelledby="tab-paste" className="space-y-3">
              <label className="block text-sm font-medium" htmlFor="paste-lang">
                Language / file type
              </label>
              <select id="paste-lang" className={field} value={lang} onChange={(e) => setLang(e.target.value)}>
                {PASTE_LANGUAGES.map((l) => (
                  <option key={l.file} value={l.file}>
                    {l.label}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-medium" htmlFor="paste-code">
                Code
              </label>
              <textarea id="paste-code" className={`${field} h-56 font-mono text-xs`} value={paste} onChange={(e) => setPaste(e.target.value)} spellCheck={false} />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={running} className="rounded-lg bg-fg px-5 py-2.5 font-medium text-bg hover:opacity-90 disabled:opacity-50">
            {running ? 'Scanning…' : 'Scan'}
          </button>
          {running && (
            <button type="button" onClick={cancel} className="rounded-lg border border-line px-4 py-2.5 text-sm">
              Cancel
            </button>
          )}
          <span className="text-xs text-muted">Skips node_modules, vendor, dist, build, minified files and files over 512 KB; max 3,000 files.</span>
        </div>
      </form>

      {state.phase === 'running' && <Progress state={state} />}
      {state.phase === 'error' && (
        <p role="alert" className="rounded-xl border border-danger bg-danger-soft p-4 text-sm">
          {state.message}
        </p>
      )}
      {state.phase === 'done' && <CodeResults report={state.report} shared={shared} />}
    </div>
  );
}

function Progress({ state }: { state: Extract<ReturnType<typeof useQuantumScan>['state'], { phase: 'running' }> }) {
  const pct = state.filesTotal ? Math.round((100 * state.filesDone) / state.filesTotal) : undefined;
  const recent = state.findings.slice(-6).reverse();
  return (
    <section aria-live="polite" aria-label="Scan progress" className="rounded-xl border border-line bg-card p-5">
      <p className="text-sm">{state.status}</p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? 0}
        aria-label="Files analysed"
      >
        <div className="h-full bg-accent transition-all" style={{ width: `${pct ?? 5}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {state.filesDone}
        {state.filesTotal ? ` / ${state.filesTotal}` : ''} files analysed · {state.findings.length} findings
        {state.current ? <span className="ml-2 font-mono text-xs">{state.current}</span> : null}
      </p>
      {recent.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {recent.map((f) => (
            <li key={`${f.file}:${f.line}:${f.ruleId}`} className="truncate">
              <span className="font-mono text-xs text-muted">
                {f.file}:{f.line}
              </span>{' '}
              {f.algorithm} — {RISK_META[f.quantumRisk].title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
