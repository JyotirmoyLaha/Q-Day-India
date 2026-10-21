import Link from 'next/link';
import { getLatest, summarise } from '@/lib/data';
import { t } from '@/lib/i18n';
import { formatDate, pct } from '@/lib/format';
import { HomeForms } from '@/components/HomeForms';
import { SectorBars } from '@/components/SectorBars';

export default function HomePage() {
  const latest = getLatest();
  const s = summarise(latest.results);
  const safeShare = pct(s.quantumSafe, s.reachable);

  return (
    <div className="space-y-14">
      <section className="pt-4">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent">
          Quantum Readiness Index · India
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {t('site.tagline')}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Data recorded today can be decrypted once large quantum computers arrive. We track which Indian
          banks, government portals, payment and education sites already use quantum-safe key exchange, and we
          help you find the classical crypto in your own code.
        </p>
        <div className="mt-8">
          <HomeForms trackedHosts={latest.results.map((r) => r.host)} />
        </div>
      </section>

      <section aria-labelledby="stats">
        <h2 id="stats" className="sr-only">
          Headline numbers
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
          <Stat value={`${safeShare}%`} label={t('home.statPq')} accent />
          <Stat value={String(s.tracked)} label={t('home.statTracked')} />
          <Stat value={String(s.exposed)} label={t('home.statExposed')} />
          <Stat value={String(s.legacy)} label={t('home.statLegacy')} />
        </dl>
        <p className="mt-2 text-xs text-muted">
          {t('home.lastScan')}: {formatDate(latest.scannedAt)} · {s.reachable} of {s.tracked} hosts reachable
          · percentages are of reachable hosts ·{' '}
          <Link href="/about" className="underline">
            methodology
          </Link>
        </p>
      </section>

      <section aria-labelledby="sector-chart" className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sector-chart" className="font-serif text-2xl font-semibold">
            {t('home.sectorChart')}
          </h2>
          <Link href="/index" className="text-sm text-accent underline">
            Explore the full index →
          </Link>
        </div>
        <SectorBars summary={s} caption={t('home.sectorChartDesc')} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Teaser href="/qday" title="When is your Q-Day?">
          Mosca&apos;s inequality: data shelf life + migration time vs. the arrival of a quantum computer.
        </Teaser>
        <Teaser href="/org" title="One report for your organisation">
          Your public TLS grade and your code&apos;s crypto inventory, with a migration plan mapped to
          India&apos;s roadmap.
        </Teaser>
        <Teaser href="/report" title="State of the Nation">
          Monthly report on India&apos;s quantum readiness: sectors, movers, and the CDN effect.
        </Teaser>
      </section>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="bg-card p-5">
      <dt className="sr-only">{label}</dt>
      <dd className={`font-serif text-4xl font-semibold tabular-nums ${accent ? 'text-accent' : ''}`}>
        {value}
      </dd>
      <dd className="mt-1 text-sm text-muted">{label}</dd>
    </div>
  );
}

function Teaser({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group rounded-xl border border-line bg-card p-5 hover:border-accent">
      <h2 className="font-serif text-lg font-semibold group-hover:text-accent">{title} →</h2>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </Link>
  );
}
