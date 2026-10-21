'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { toCycloneDX, type ScanReport } from '@qday/cbom-engine';
import type { SiteResult } from '@/lib/types';
import { buildPlan, defaultTrack, DST_PHASES, type Track } from '@/lib/plan';
import { download } from '@/lib/share';
import { t } from '@/lib/i18n';
import { CodeScanner } from './code/CodeScanner';
import { fetchLiveScan } from './LiveCheck';
import { cleanHost } from './HomeForms';
import { GradeChip } from './GradeChip';
import { Card } from './Tags';
import { Gauge } from './code/Gauge';

export function OrgReport() {
  const [domain, setDomain] = useState('');
  const [site, setSite] = useState<{ result: SiteResult; at: string } | null>(null);
  const [siteMsg, setSiteMsg] = useState<{ text: string; url?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [code, setCode] = useState<ScanReport | null>(null);
  const [trackChoice, setTrackChoice] = useState<Track | null>(null);
  const onReport = useCallback((r: ScanReport | null) => setCode(r), []);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const h = cleanHost(domain);
    if (!h) return;
    setChecking(true);
    setSiteMsg(null);
    const s = await fetchLiveScan(h);
    setChecking(false);
    if (s.phase === 'done') setSite({ result: s.result, at: s.scannedAt });
    else if (s.phase === 'unavailable')
      setSiteMsg({ text: `${s.message} You can still build the code half of the report.`, url: s.url });
    else if (s.phase === 'error') setSiteMsg({ text: s.message });
  }

  const track: Track = trackChoice ?? defaultTrack(site?.result.sector);
  const plan = site || code ? buildPlan(site?.result ?? null, code, track) : [];
  const highCount = code?.findings.filter((f) => f.quantumRisk === 'HIGH').length ?? 0;

  return (
    <div className="space-y-10">
      <section aria-labelledby="step1" className="space-y-4">
        <h2 id="step1" className="font-serif text-2xl font-semibold">
          1 · Your public website
        </h2>
        <form onSubmit={check} className="flex flex-wrap gap-2">
          <label htmlFor="org-domain" className="sr-only">
            Domain
          </label>
          <input
            id="org-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. www.yourbank.in"
            className="min-w-[16rem] flex-1 rounded-lg border border-line bg-card px-4 py-2.5"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            className="rounded-lg bg-fg px-5 py-2.5 font-medium text-bg disabled:opacity-50"
            disabled={checking}
          >
            {checking ? 'Checking…' : 'Check TLS'}
          </button>
        </form>
        {siteMsg && (
          <p role="status" className="rounded-lg border border-exposed bg-exposed-soft px-4 py-3 text-sm">
            {siteMsg.text}{' '}
            {siteMsg.url && (
              <a href={siteMsg.url} className="underline">
                Request a scan on GitHub
              </a>
            )}
          </p>
        )}
        {site && (
          <Card className="flex flex-wrap items-center gap-6">
            <GradeChip grade={site.result.grade} date={site.at} size="lg" />
            <div className="min-w-[14rem] flex-1">
              <p className="font-mono text-sm text-muted">{site.result.host}</p>
              <p className="mt-1">{t(`grade.${site.result.grade ?? 'none'}`)}.</p>
              {site.result.grade && (
                <p className="mt-1 text-sm text-muted">
                  {t('hndl.label')}: <strong className="text-fg">{site.result.hndlRisk}/100</strong>
                </p>
              )}
            </div>
            <Link href={`/check?host=${site.result.host}`} className="text-sm text-accent underline">
              Full TLS report →
            </Link>
          </Card>
        )}
      </section>

      <section aria-labelledby="step2" className="space-y-4">
        <h2 id="step2" className="font-serif text-2xl font-semibold">
          2 · Your code (private: scanned in this browser)
        </h2>
        <CodeScanner onReport={onReport} />
      </section>

      {plan.length > 0 && (
        <section aria-labelledby="plan" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="plan" className="font-serif text-3xl font-semibold">
                3 · Prioritised migration plan
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted">
                Public TLS first (it protects traffic that can be recorded today), then key exchange in code,
                then signatures, then hashes and symmetric strength. Each step maps to a phase of the DST Task
                Force roadmap (&ldquo;Implementation of Quantum Safe Ecosystem in India&rdquo;, 2026).
              </p>
            </div>
            <fieldset className="flex gap-3 text-sm">
              <legend className="sr-only">Roadmap track</legend>
              {(['cii', 'enterprise'] as const).map((tr) => (
                <label key={tr} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="track"
                    checked={track === tr}
                    onChange={() => setTrackChoice(tr)}
                  />
                  {tr === 'cii' ? 'Critical Information Infrastructure' : 'Regular enterprise'}
                </label>
              ))}
            </fieldset>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(DST_PHASES) as (keyof typeof DST_PHASES)[]).map((k) => (
              <div key={k} className="rounded-lg border border-line bg-card p-3 text-sm">
                <p className="font-semibold">
                  {DST_PHASES[k].name}{' '}
                  <span className="font-normal text-muted">· by {DST_PHASES[k][track]}</span>
                </p>
                <p className="mt-1 text-muted">{DST_PHASES[k].summary}</p>
              </div>
            ))}
          </div>

          <ol className="space-y-3">
            {plan.map((p) => (
              <li
                key={p.order}
                className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl border border-line bg-card p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle font-semibold">
                  {p.order}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs">
                      {DST_PHASES[p.phase].name} · {p.deadline}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    <span className="font-medium text-fg">{p.area}.</span> {p.detail}
                    {p.count ? ` ${p.count} finding${p.count === 1 ? '' : 's'}.` : ''}
                  </p>
                  {p.files && p.files.length > 0 && (
                    <p className="mt-1 break-all font-mono text-xs text-muted">{p.files.join(' · ')}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-card p-5">
            {code && <Gauge value={code.scores.exposure} label="Code: Quantum Exposure" />}
            <div className="flex flex-col gap-2 text-sm">
              {code && (
                <button
                  className="rounded-lg border border-line px-3 py-1.5 hover:border-accent"
                  onClick={() =>
                    download(
                      `${code.source.name.replace(/[^\w.-]+/g, '_')}.cdx.json`,
                      JSON.stringify(toCycloneDX(code), null, 2),
                    )
                  }
                >
                  Download the CBOM (CycloneDX 1.6)
                </button>
              )}
              <Link
                className="text-accent underline"
                href={`/qday?${new URLSearchParams({ ...(site?.result.sector ? { sector: site.result.sector } : {}), ...(code ? { findings: String(highCount) } : {}) })}`}
              >
                See your Q-Day margin with these inputs →
              </Link>
            </div>
          </div>
          <p className="text-xs text-muted">
            Roadmap phases and years are taken from public summaries of the DST Task Force report; check the
            official document for your sector&apos;s obligations. Banking and other regulated sectors may be
            classed as critical infrastructure by their regulator.
          </p>
        </section>
      )}
    </div>
  );
}
