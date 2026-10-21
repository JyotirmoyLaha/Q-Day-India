import Link from 'next/link';
import { getLatest, summarise } from '@/lib/data';
import { isQuantumSafe } from '@/lib/grading';
import { t, sectorLabel } from '@/lib/i18n';
import { formatDate, pct } from '@/lib/format';
import { GRADES } from '@/lib/types';
import { HomeForms } from '@/components/HomeForms';
import { GradeDonut } from '@/components/GradeDonut';
import { GRADE_VAR } from '@/components/GradeChip';
import { Icon, type IconName } from '@/components/Icon';

const EXAMPLE_HOSTS = [
  'www.hdfc.bank.in',
  'onlinesbi.sbi.bank.in',
  'uidai.gov.in',
  'www.irctc.co.in',
  'www.iitb.ac.in',
];

export default function HomePage() {
  const latest = getLatest();
  const s = summarise(latest.results);
  const safeShare = pct(s.quantumSafe, s.reachable);
  const graded = latest.results.filter((r) => r.grade);
  const cdn = graded.filter((r) => r.http?.cdn && r.http.cdn !== 'other');
  const self = graded.filter((r) => !r.http?.cdn);
  const cdnShare = pct(cdn.filter((r) => isQuantumSafe(r.grade)).length, cdn.length);
  const selfShare = pct(self.filter((r) => isQuantumSafe(r.grade)).length, self.length);
  const hosts = latest.results.map((r) => r.host);
  const examples = EXAMPLE_HOSTS.filter((h) => hosts.includes(h)).slice(0, 3);
  const sectors = [...s.bySector].sort(
    (a, b) => pct(b.counts['A+'] + b.counts.A, b.total) - pct(a.counts['A+'] + a.counts.A, a.total),
  );

  return (
    <div className="space-y-20">
      {/* ---------- hero ---------- */}
      <section className="hero-bg relative overflow-hidden rounded-3xl border border-line px-5 py-10 sm:px-10 sm:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Weekly scan · {formatDate(latest.scannedAt)} · {s.tracked} Indian sites
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Is India ready for <span className="text-gradient whitespace-nowrap">Q-Day</span>?
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Traffic recorded today can be decrypted once large quantum computers arrive. We track which
              Indian banks, government portals and apps already use quantum-safe encryption, and help you find
              the classical crypto in your own code.
            </p>
            <div className="mt-8 max-w-2xl">
              <HomeForms trackedHosts={hosts} examples={examples} />
            </div>
          </div>
          <div className="card fade-up mx-auto w-full max-w-sm p-6 [animation-delay:120ms]">
            <p className="text-center text-sm font-semibold">Quantum-safe key exchange today</p>
            <div className="mt-2">
              <GradeDonut
                byGrade={s.byGrade}
                total={s.reachable}
                centerValue={`${safeShare}%`}
                centerLabel="graded A or A+"
              />
            </div>
            <Link href="/readiness" className="btn btn-secondary mt-5 w-full">
              Explore all {s.tracked} sites
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- KPIs ---------- */}
      <section aria-labelledby="stats">
        <h2 id="stats" className="sr-only">
          Headline numbers
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon="shield-check" tone="safe" value={`${safeShare}%`} label={t('home.statPq')} />
          <Kpi icon="alert" tone="exposed" value={String(s.exposed)} label={t('home.statExposed')} />
          <Kpi icon="clock" tone="exposed" value={String(s.legacy)} label={t('home.statLegacy')} />
          <Kpi
            icon="globe"
            tone="info"
            value={String(s.tracked)}
            label={`${t('home.statTracked')} · ${s.reachable} reachable`}
          />
        </ul>
      </section>

      {/* ---------- sectors ---------- */}
      <section aria-labelledby="sector-chart">
        <SectionHead
          id="sector-chart"
          eyebrow="By sector"
          title="Who is already quantum-safe?"
          lead="Share of reachable sites in each sector whose key exchange is quantum-safe (grade A or A+). Click a sector to see every site."
          href="/readiness"
          linkLabel="Full index"
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((x) => {
            const safe = x.counts['A+'] + x.counts.A;
            const share = pct(safe, x.total);
            return (
              <li key={x.sector}>
                <Link
                  href={`/readiness?sector=${x.sector}`}
                  className="card group block p-5 transition-transform hover:-translate-y-0.5 hover:border-accent"
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold">{sectorLabel(x.sector)}</h3>
                    <span className="text-xs text-muted">{x.total} sites</span>
                  </div>
                  <p className="mt-3 font-display text-4xl font-bold tabular-nums">
                    {share}
                    <span className="text-xl text-muted">%</span>
                  </p>
                  <p className="text-xs text-muted">
                    quantum-safe ({safe} of {x.total})
                  </p>
                  <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                    {GRADES.map((g) =>
                      x.counts[g] ? (
                        <span
                          key={g}
                          style={{ width: `${(100 * x.counts[g]) / x.total}%`, background: GRADE_VAR[g] }}
                        />
                      ) : null,
                    )}
                  </div>
                  <p className="sr-only">{GRADES.map((g) => `${g}: ${x.counts[g]}`).join(', ')}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- CDN effect ---------- */}
      <section className="card overflow-hidden" aria-labelledby="cdn">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">The CDN effect</p>
            <h2 id="cdn" className="mt-2 font-display text-3xl font-bold tracking-tight">
              Most of India&apos;s progress comes from CDNs, not from origin servers
            </h2>
            <p className="mt-3 text-muted">
              Cloudflare, Akamai, CloudFront and Fastly switched on hybrid post-quantum key exchange by
              default. Sites that serve traffic from their own servers mostly have not — yet the fix is often
              a one-line config change.
            </p>
            <Link href="/report" className="btn btn-secondary mt-5">
              Read the State of the Nation
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <BigStat
              value={`${cdnShare}%`}
              label={`behind a major CDN (${cdn.length} sites)`}
              color="var(--g-aplus)"
            />
            <BigStat
              value={`${selfShare}%`}
              label={`self-hosted (${self.length} sites)`}
              color="var(--g-d)"
            />
          </div>
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section aria-labelledby="how">
        <SectionHead id="how" eyebrow="How it works" title="Measure, grade, fix" />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [
              'server',
              'We shake hands',
              'Every Monday, five ordinary TLS handshakes per site test whether it offers the hybrid post-quantum group X25519MLKEM768. No logins, no crawling.',
            ],
            [
              'chart',
              'We grade key exchange',
              'A+ to F, plus a harvest-now-decrypt-later exposure score weighted by how long each sector’s data stays sensitive.',
            ],
            [
              'sparkles',
              'You get the fix',
              'Every grade below A comes with copy-paste configuration for nginx, Apache, HAProxy, CDNs, Go, Node.js and Java.',
            ],
          ].map(([icon, title, body], i) => (
            <li key={title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={icon as IconName} />
                </span>
                <span className="font-display text-sm font-bold text-muted">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- tools ---------- */}
      <section aria-labelledby="tools">
        <SectionHead id="tools" eyebrow="Tools" title="Everything you need to plan the migration" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="card group flex h-full flex-col p-6 transition-transform hover:-translate-y-0.5 hover:border-accent"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-subtle text-accent">
                  <Icon name={tool.icon} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold group-hover:text-accent">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{tool.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Open{' '}
                  <Icon
                    name="arrow-right"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="hero-bg overflow-hidden rounded-3xl border border-line px-6 py-12 text-center sm:px-12">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Find the classical crypto in your code
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          QuantumBOM scans a GitHub repo, a zip or a snippet entirely in your browser and exports a CycloneDX
          cryptographic bill of materials — the inventory India&apos;s roadmap asks for.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/code" className="btn btn-primary">
            <Icon name="code" className="h-4 w-4" /> Scan your code
          </Link>
          <Link href="/learn" className="btn btn-secondary">
            <Icon name="book" className="h-4 w-4" /> Learn the basics
          </Link>
        </div>
      </section>
    </div>
  );
}

const TOOLS: { href: string; icon: IconName; title: string; body: string }[] = [
  {
    href: '/readiness',
    icon: 'chart',
    title: 'Quantum Readiness Index',
    body: 'Weekly grades for verified Indian banks, government portals, payment apps, insurers, hospitals and universities.',
  },
  {
    href: '/check',
    icon: 'globe',
    title: 'Check any website',
    body: 'A live post-quantum TLS check of any public hostname, with the fix for its server or CDN.',
  },
  {
    href: '/code',
    icon: 'code',
    title: 'QuantumBOM code scanner',
    body: 'Finds RSA, ECC, DH, MD5 and friends in Python, JS/TS, Java, Go and configs — privately, in your browser.',
  },
  {
    href: '/org',
    icon: 'building',
    title: 'Organisation report',
    body: 'Your website and your code together, with a migration plan mapped to India’s DST roadmap.',
  },
  {
    href: '/qday',
    icon: 'calculator',
    title: 'Q-Day calculator',
    body: 'Mosca’s inequality: is your data’s secrecy period longer than the time before a quantum computer?',
  },
  {
    href: '/learn',
    icon: 'book',
    title: 'Learn in 10 minutes',
    body: 'Shor, Grover, ML-KEM and harvest-now-decrypt-later explained without the physics.',
  },
];

function Kpi({
  icon,
  tone,
  value,
  label,
}: {
  icon: IconName;
  tone: 'safe' | 'exposed' | 'info';
  value: string;
  label: string;
}) {
  const toneCls = {
    safe: 'bg-accent-soft text-accent',
    exposed: 'bg-exposed-soft text-exposed',
    info: 'bg-info-soft text-info',
  }[tone];
  return (
    <li className="card flex items-start gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneCls}`}>
        <Icon name={icon} />
      </span>
      <div>
        <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
        <p className="mt-0.5 text-sm text-muted">{label}</p>
      </div>
    </li>
  );
}

function BigStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-line bg-subtle p-6 text-center">
      <p className="font-display text-5xl font-bold tabular-nums sm:text-6xl" style={{ color: 'var(--fg)' }}>
        {value}
      </p>
      <div
        className="mx-auto mt-3 h-1.5 w-16 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      <p className="mt-3 text-sm text-muted">quantum-safe {label}</p>
    </div>
  );
}

function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  href,
  linkLabel,
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        {lead && <p className="mt-3 text-muted">{lead}</p>}
      </div>
      {href && (
        <Link href={href} className="btn btn-secondary">
          {linkLabel}
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
