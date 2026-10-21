'use client';

import { useMemo, useState } from 'react';
import { assetName, getFix, toCycloneDX, toMarkdown, toSARIF, type Finding, type QuantumRisk, type ScanReport } from '@qday/cbom-engine';
import { download, shareURL } from '@/lib/share';
import { formatDate } from '@/lib/format';
import { Gauge } from './Gauge';
import { FixPanel } from './FixPanel';

export const RISK_META: Record<QuantumRisk, { title: string; tone: string; desc: string }> = {
  HIGH: { title: 'Not quantum-safe (Shor)', tone: 'border-exposed bg-exposed-soft', desc: 'Public-key algorithms a future quantum computer can break. Migration recommended.' },
  CLASSICAL_BROKEN: { title: 'Already weak today', tone: 'border-danger bg-danger-soft', desc: 'Weak against classical attacks too (MD5, SHA-1, DES, RC4, short RSA, TLS 1.0/1.1). Fix first.' },
  LOW: { title: 'Grover-affected', tone: 'border-line bg-subtle', desc: 'Symmetric strength halved in theory (e.g. AES-128). Prefer 256-bit keys for long-lived data.' },
  NONE: { title: 'Informational / quantum-safe', tone: 'border-accent bg-accent-soft', desc: 'Inventory items with no quantum risk, including post-quantum algorithms already in use.' },
};
const ORDER: QuantumRisk[] = ['HIGH', 'CLASSICAL_BROKEN', 'LOW', 'NONE'];

export function CodeResults({ report, shared = false }: { report: ScanReport; shared?: boolean }) {
  const [risk, setRisk] = useState<QuantumRisk | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const counts = useMemo(() => Object.fromEntries(ORDER.map((r) => [r, report.findings.filter((f) => f.quantumRisk === r).length])) as Record<QuantumRisk, number>, [report]);
  const visible = useMemo(
    () => report.findings.filter((f) => (risk === 'ALL' || f.quantumRisk === risk) && (!q || f.file.toLowerCase().includes(q.toLowerCase()) || f.algorithm.toLowerCase().includes(q.toLowerCase()))),
    [report, risk, q],
  );
  const slug = report.source.name.replace(/[^\w.-]+/g, '_');

  async function share() {
    const url = shareURL(report, window.location.href);
    if (!url) {
      download(`${slug}.quantumbom.json`, JSON.stringify(report, null, 2));
      setShareMsg('This report is too large for a link (> 30 KB compressed), so it was downloaded as JSON instead. Share the file.');
      return;
    }
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied. The report lives in the URL fragment (#…), which browsers never send to a server.');
    } catch {
      setShareMsg('Link is in the address bar. The report lives in the URL fragment (#…), which browsers never send to a server.');
    }
  }

  const btn = 'rounded-lg border border-line bg-card px-3 py-1.5 text-sm hover:border-accent';
  return (
    <section aria-labelledby="results-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{shared ? 'Shared report (decoded in your browser)' : 'Results'}</p>
          <h2 id="results-title" className="font-serif text-3xl font-semibold">
            {report.source.url ? (
              <a href={report.source.url} className="hover:underline">
                {report.source.name}
              </a>
            ) : (
              report.source.name
            )}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {report.source.ref ? `${report.source.ref} · ` : ''}scanned {formatDate(report.scannedAt)} · {report.stats.filesScanned} files analysed
            {report.stats.filesSeen > report.stats.filesScanned ? ` of ${report.stats.filesSeen}` : ''} in {(report.stats.durationMs / 1000).toFixed(1)} s ·{' '}
            {report.findings.length} findings
            {report.stats.suppressed ? ` (${report.stats.suppressed} suppressed)` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={() => download(`${slug}.quantumbom.cdx.json`, JSON.stringify(toCycloneDX(report), null, 2))}>
            CBOM (CycloneDX 1.6)
          </button>
          <button className={btn} onClick={() => download(`${slug}.quantumbom.sarif`, JSON.stringify(toSARIF(report), null, 2))}>
            SARIF
          </button>
          <button className={btn} onClick={() => download(`${slug}.quantumbom.md`, toMarkdown(report), 'text/markdown')}>
            Markdown
          </button>
          <button className={`${btn} border-accent`} onClick={share}>
            Share
          </button>
        </div>
      </div>
      {shareMsg && (
        <p role="status" className="rounded-lg border border-line bg-subtle px-4 py-2 text-sm">
          {shareMsg}
        </p>
      )}
      {report.warnings.map((w) => (
        <p key={w} className="rounded-lg border border-dashed border-exposed px-4 py-2 text-sm">
          {w}
        </p>
      ))}

      <div className="grid gap-6 rounded-xl border border-line bg-card p-5 md:grid-cols-2">
        <div>
          <Gauge value={report.scores.exposure} label="Quantum Exposure" caption="0 = no classical public-key crypto found" />
          <ScoreInputs inputs={report.scores.exposureInputs} />
        </div>
        <div>
          <Gauge value={report.scores.agility} label="Crypto-Agility" goodHigh caption="100 = algorithm choices live in one place" />
          <ScoreInputs inputs={report.scores.agilityInputs} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by risk">
        <button className={`${btn} ${risk === 'ALL' ? 'border-fg' : ''}`} aria-pressed={risk === 'ALL'} onClick={() => setRisk('ALL')}>
          All ({report.findings.length})
        </button>
        {ORDER.map((r) => (
          <button key={r} className={`${btn} ${risk === r ? 'border-fg' : ''}`} aria-pressed={risk === r} onClick={() => setRisk(r)}>
            {RISK_META[r].title} ({counts[r]})
          </button>
        ))}
        <label className="ml-auto">
          <span className="sr-only">Filter by file or algorithm</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by file or algorithm"
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      {report.findings.length === 0 && (
        <p className="rounded-xl border border-accent bg-accent-soft p-6 text-center">
          No cryptography findings. Either this code uses no public-key crypto directly, or it chooses algorithms at runtime
          (which static analysis cannot see).
        </p>
      )}

      {ORDER.filter((r) => risk === 'ALL' || r === risk).map((r) => {
        const fs = visible.filter((f) => f.quantumRisk === r);
        if (!fs.length) return null;
        return <RiskGroup key={r} risk={r} findings={fs} />;
      })}
    </section>
  );
}

function ScoreInputs({ inputs }: { inputs: { label: string; value: string | number }[] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-center text-muted hover:text-fg">How is this calculated?</summary>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        {inputs.map((i) => (
          <div key={i.label} className="contents">
            <dt className="text-muted">{i.label}</dt>
            <dd className="text-right font-mono tabular-nums">{i.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function RiskGroup({ risk, findings }: { risk: QuantumRisk; findings: Finding[] }) {
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);
  const meta = RISK_META[risk];
  return (
    <section className={`rounded-xl border-l-4 ${meta.tone.split(' ')[0]} border border-line bg-card`} aria-label={meta.title}>
      <header className="border-b border-line px-5 py-3">
        <h3 className="font-serif text-xl font-semibold">
          {meta.title} <span className="text-base font-normal text-muted">· {findings.length}</span>
        </h3>
        <p className="text-sm text-muted">{meta.desc}</p>
      </header>
      <div className="divide-y divide-line">
        {[...byFile.entries()].map(([file, fs], i) => (
          <details key={file} open={i < 5} className="group px-5 py-3">
            <summary className="cursor-pointer list-none font-mono text-sm [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition group-open:rotate-90" aria-hidden="true">
                ›
              </span>
              {file} <span className="font-sans text-muted">({fs.length})</span>
            </summary>
            <ul className="mt-2 space-y-4">
              {fs.map((f) => (
                <FindingItem key={`${f.ruleId}:${f.line}:${f.column}`} f={f} />
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

function FindingItem({ f }: { f: Finding }) {
  const [open, setOpen] = useState(false);
  const fix = getFix(f.fixId);
  return (
    <li>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-mono text-xs text-muted">L{f.line}</span>
        <span className="font-semibold">{assetName(f)}</span>
        <span className="text-muted">{f.primitive}</span>
        <span className="rounded border border-line px-1.5 text-xs text-muted" title="How sure the scanner is that this is a real use">
          {f.confidence} confidence
        </span>
      </div>
      <p className="mt-1 text-sm">{f.message}</p>
      <pre className="mt-1.5 overflow-x-auto rounded-md border border-line bg-subtle p-2.5 font-mono text-xs leading-relaxed">
        <code>{f.snippet}</code>
      </pre>
      {fix && (
        <button
          type="button"
          className="mt-1.5 text-sm text-accent underline"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide fix' : `Fix: ${fix.title}`}
        </button>
      )}
      {open && fix && <FixPanel fix={fix} />}
    </li>
  );
}
