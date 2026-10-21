import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSnapshots } from '@/lib/data';
import { buildMonthReport, reportMonths } from '@/lib/report';
import { formatDate } from '@/lib/format';
import { sectorLabel } from '@/lib/i18n';
import { GRADES } from '@/lib/types';
import { ShareBars } from '@/components/ReportCharts';
import { GradeChip } from '@/components/GradeChip';
import { GRADE_FILL, GradeLegend } from '@/components/SectorBars';
import { Card } from '@/components/Tags';

export const dynamicParams = false;

export function generateStaticParams() {
  return reportMonths(getSnapshots()).map((month) => ({ month }));
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  const r = buildMonthReport(getSnapshots(), month);
  return {
    title: r ? `State of Quantum Readiness in India — ${r.label}` : 'Report',
    description: r?.summary[0],
  };
}

export default async function ReportPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const snaps = getSnapshots();
  const r = buildMonthReport(snaps, month);
  if (!r) notFound();
  const months = reportMonths(snaps);
  const i = months.indexOf(month);
  const cdnData = [
    { label: 'Behind a CDN', share: r.cdn.cdnShare, total: r.cdn.behindCdn },
    { label: 'Self-hosted', share: r.cdn.selfShare, total: r.cdn.selfHosted },
    ...r.cdn.byProvider.map((p) => ({ label: `  ${p.cdn}`, share: Math.round((100 * p.safe) / p.total), total: p.total })),
  ];

  return (
    <article className="space-y-10">
      <header>
        <nav aria-label="Report months" className="flex justify-between text-sm text-muted">
          {i > 0 ? <Link href={`/report/${months[i - 1]}`}>← {months[i - 1]}</Link> : <span />}
          {i < months.length - 1 ? <Link href={`/report/${months[i + 1]}`}>{months[i + 1]} →</Link> : <span />}
        </nav>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.14em] text-accent">State of the Nation · {r.label}</p>
        <h1 className="mt-2 max-w-4xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {r.safeShare}% of tracked Indian websites already use quantum-safe key exchange
        </h1>
        <p className="mt-3 text-muted">
          Based on the weekly scan of {formatDate(r.scanDate)} ({r.reachable} reachable of {r.tracked} tracked hosts;{' '}
          {r.scansInMonth} scan{r.scansInMonth === 1 ? '' : 's'} this month).{' '}
          <Link href="/about" className="underline">
            Methodology
          </Link>
        </p>
      </header>

      <section aria-labelledby="summary" className="prose-qd max-w-3xl">
        <h2 id="summary">In plain language</h2>
        <ul>
          {r.summary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p>
          A site without quantum-safe key exchange is <em>exposed to harvest-now-decrypt-later</em>: traffic recorded today
          could be decrypted once a large quantum computer exists. It does not mean the site has been compromised. Every
          site page lists the configuration change that fixes it.
        </p>
      </section>

      <section aria-labelledby="grades">
        <h2 id="grades" className="font-serif text-2xl font-semibold">
          Grade distribution
        </h2>
        <div className="mt-4 flex h-8 overflow-hidden rounded" aria-hidden="true">
          {GRADES.map((g) =>
            r.byGrade[g] ? <div key={g} style={{ width: `${(100 * r.byGrade[g]) / r.reachable}%`, background: GRADE_FILL[g] }} title={`${g}: ${r.byGrade[g]}`} /> : null,
          )}
        </div>
        <div className="mt-2">
          <GradeLegend />
        </div>
        <p className="mt-2 text-sm">
          {GRADES.map((g) => `${g}: ${r.byGrade[g]}`).join(' · ')} (of {r.reachable} reachable sites)
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl font-semibold">By sector</h2>
          <p className="mt-1 text-sm text-muted">Share of reachable sites graded A+ or A.</p>
          <div className="mt-4">
            <ShareBars data={r.sectors.map((s) => ({ label: s.label, share: s.share, total: s.total }))} />
          </div>
          <table className="mt-4 w-full text-sm">
            <caption className="sr-only">Quantum-safe share by sector</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-muted">
                <th scope="col" className="py-1">Sector</th>
                <th scope="col" className="py-1 text-right">Quantum-safe</th>
                <th scope="col" className="py-1 text-right">Sites</th>
              </tr>
            </thead>
            <tbody>
              {r.sectors.map((s) => (
                <tr key={s.sector} className="border-b border-line/60">
                  <th scope="row" className="py-1 text-left font-normal">{s.label}</th>
                  <td className="py-1 text-right tabular-nums">{s.share}%</td>
                  <td className="py-1 text-right tabular-nums">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-semibold">The CDN effect</h2>
          <p className="mt-1 text-sm text-muted">
            Quantum-safe share for sites behind a CDN vs. served from their own infrastructure (CDN detected from response
            headers).
          </p>
          <div className="mt-4">
            <ShareBars data={cdnData} />
          </div>
          <p className="mt-3 text-sm">
            Behind a CDN: {r.cdn.behindCdnSafe} of {r.cdn.behindCdn} ({r.cdn.cdnShare}%). Self-hosted: {r.cdn.selfHostedSafe} of{' '}
            {r.cdn.selfHosted} ({r.cdn.selfShare}%).
            {r.cdn.byProvider.length ? ` By provider: ${r.cdn.byProvider.map((p) => `${p.cdn} ${p.safe}/${p.total}`).join(', ')}.` : ''}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-serif text-2xl font-semibold">Biggest movers</h2>
        {r.movers.length ? (
          <ul className="mt-3 divide-y divide-line">
            {r.movers.map((m) => (
              <li key={m.host} className="flex flex-wrap items-center gap-3 py-2">
                <span className="w-6 text-center" aria-label={m.direction === 'up' ? 'improved' : 'moved down'}>
                  {m.direction === 'up' ? '▲' : '▼'}
                </span>
                <Link href={`/site/${m.host}`} className="font-medium hover:underline">
                  {m.org}
                </Link>
                <span className="font-mono text-xs text-muted">{m.host}</span>
                <span className="ml-auto text-sm">
                  {m.from} → {m.to}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {r.baselineDate ? `No grade changes since ${formatDate(r.baselineDate)}.` : 'Movers appear once there are two weekly scans to compare.'}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-serif text-2xl font-semibold">Legacy TLS stragglers</h2>
        <p className="mt-1 text-sm text-muted">
          {r.legacyCount} sites still accept TLS 1.0/1.1 (deprecated by RFC 8996). Lowest grades first; migration recommended.
        </p>
        {r.stragglers.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {r.stragglers.map((s) => (
              <li key={s.host} className="flex items-center gap-3">
                <GradeChip grade={s.grade} date={r.scanDate} size="sm" showDate={false} />
                <span>
                  <Link href={`/site/${s.host}`} className="hover:underline">
                    {s.org}
                  </Link>
                  <span className="block font-mono text-xs text-muted">
                    {s.host} · {sectorLabel(s.sector)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">Grades as of {formatDate(r.scanDate)}.</p>
      </Card>
    </article>
  );
}
