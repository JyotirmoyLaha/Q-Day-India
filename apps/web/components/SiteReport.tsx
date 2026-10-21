import type { HistoryPoint, SiteResult } from '@/lib/types';
import { t, sectorLabel } from '@/lib/i18n';
import { certAlgorithm, formatDate, groupLabel, issuerName } from '@/lib/format';
import { HNDL_FORMULA, SECTOR_WEIGHTS } from '@/lib/grading';
import { siteFixes } from '@/lib/siteFixes';
import { SITE_URL, scanRequestURL } from '@/lib/site';
import { GradeChip, GRADE_VAR } from './GradeChip';
import { RiskMeter } from './RiskMeter';
import { HistoryChart } from './HistoryChart';
import { CopyField } from './CopyField';
import { CodeBlock } from './CodeBlock';
import { Card, CardTitle, Pill, UnverifiedTag, VerifiedTag } from './Tags';
import { Icon } from './Icon';

const PROBES: {
  key: keyof NonNullable<SiteResult['probes']>;
  name: string;
  desc: string;
  goodWhenOk: boolean;
}[] = [
  {
    key: 'default',
    name: 'P1 Default',
    desc: 'Standard handshake (offers X25519MLKEM768 and classical groups)',
    goodWhenOk: true,
  },
  { key: 'pqOnly', name: 'P2 PQ-only', desc: 'TLS 1.3 offering only X25519MLKEM768', goodWhenOk: true },
  {
    key: 'pqAlt',
    name: 'P3 PQ-alt',
    desc: 'TLS 1.3 offering only SecP256r1MLKEM768 / SecP384r1MLKEM1024',
    goodWhenOk: true,
  },
  { key: 'tls13', name: 'P4 TLS 1.3', desc: 'TLS 1.3 only', goodWhenOk: true },
  { key: 'legacy', name: 'P5 Legacy', desc: 'TLS 1.0/1.1 only (accepted = penalty)', goodWhenOk: false },
  { key: 'head', name: 'H1 HEAD', desc: 'One HTTPS HEAD / for HSTS and CDN headers', goodWhenOk: true },
];

function verdict(site: SiteResult): { tone: string; title: string } {
  switch (site.grade) {
    case 'A+':
    case 'A':
      return { tone: 'bg-accent-soft', title: 'Uses quantum-safe key exchange' };
    case 'B':
      return { tone: 'bg-info-soft', title: 'Quantum-safe key exchange supported, but not used by default' };
    case 'C':
    case 'D':
      return {
        tone: 'bg-exposed-soft',
        title: 'Not yet quantum-safe — exposed to harvest-now-decrypt-later',
      };
    case 'F':
      return { tone: 'bg-danger-soft', title: 'Legacy-only TLS or an invalid certificate chain' };
    default:
      return { tone: 'bg-subtle', title: 'Could not be graded from our scanner' };
  }
}

/** Full report for one host. Used by /site/[host] (weekly data) and /check (live scan). */
export function SiteReport({
  site,
  scannedAt,
  history,
  live = false,
}: {
  site: SiteResult;
  scannedAt: string;
  history?: HistoryPoint[];
  live?: boolean;
}) {
  const fixes = siteFixes(site);
  const badgeURL = `${SITE_URL}/api/badge?host=${site.host}`;
  const pageURL = `${SITE_URL}/site/${site.host}`;
  const v = verdict(site);

  return (
    <article className="space-y-6">
      {/* ---------- hero ---------- */}
      <header className="card relative overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ background: GRADE_VAR[site.grade ?? 'none'] }}
          aria-hidden="true"
        />
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{sectorLabel(site.sector)}</span>
              {site.subsector && <span>· {site.subsector.replace(/_/g, ' ')}</span>}
              {live && <Pill tone="info">live scan</Pill>}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{site.org}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm text-muted">
              <a
                href={`https://${site.host}`}
                className="inline-flex items-center gap-1 hover:text-fg"
                rel="noreferrer"
              >
                {site.host}
                <Icon name="external" className="h-3.5 w-3.5" />
              </a>
              {!live && (site.verified ? <VerifiedTag /> : <UnverifiedTag />)}
            </p>
            <div className={`mt-5 rounded-xl px-4 py-3 ${v.tone}`}>
              <p className="font-semibold">{v.title}</p>
              <p className="mt-0.5 text-sm text-muted">
                {t(`grade.${site.grade ?? 'none'}`)}. {t('scanDate', { date: formatDate(scannedAt) })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 md:flex-col md:items-end">
            <GradeChip grade={site.grade} date={scannedAt} size="lg" />
            {site.grade && (
              <div className="md:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('hndl.label')}</p>
                <p className="mt-1 font-display text-4xl font-bold tabular-nums">
                  {site.hndlRisk}
                  <span className="text-lg text-muted">/100</span>
                </p>
                <RiskMeter risk={site.hndlRisk} compact={false} />
              </div>
            )}
          </div>
        </div>
      </header>

      {!site.reachable && (
        <Card>
          <CardTitle icon="info">Could not be graded</CardTitle>
          <p className="mt-3 text-sm">
            {site.error ? t(`errors.${site.error.code}`) : 'The host did not complete a handshake'} on port
            443 from our scanner. Nothing is implied about the site&apos;s security: it may be down, slow,
            geo-restricted to Indian networks, or not serving HTTPS on this hostname.
          </p>
          {site.error?.detail && (
            <p className="mt-2 break-all font-mono text-xs text-muted">{site.error.detail}</p>
          )}
        </Card>
      )}

      {site.tls && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle icon="key">Key exchange</CardTitle>
            <dl className="mt-4 divide-y divide-line text-sm">
              <Row label="Default group">
                <span className="font-mono">{groupLabel(site.tls.defaultGroup)}</span>
              </Row>
              <Row label="X25519MLKEM768">
                {site.tls.pqHybrid.x25519mlkem768 ? (
                  <Pill tone="safe">supported</Pill>
                ) : (
                  <Pill tone="exposed">not offered</Pill>
                )}
              </Row>
              <Row label="Other PQ hybrids">
                {site.tls.pqHybrid.secp256r1mlkem768 || site.tls.pqHybrid.secp384r1mlkem1024
                  ? [
                      site.tls.pqHybrid.secp256r1mlkem768 && 'SecP256r1MLKEM768',
                      site.tls.pqHybrid.secp384r1mlkem1024 && 'SecP384r1MLKEM1024',
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : 'none'}
              </Row>
              <Row label="Highest TLS">{site.tls.maxVersion.replace('TLS', 'TLS ')}</Row>
              <Row label="TLS 1.0/1.1">
                {site.tls.legacyEnabled ? (
                  <Pill tone="exposed">still accepted</Pill>
                ) : (
                  <Pill tone="safe">disabled</Pill>
                )}
              </Row>
              <Row label="Cipher suite">
                <span className="break-all font-mono text-xs">{site.tls.cipherSuite}</span>
              </Row>
              {site.tls.alpn && (
                <Row label="ALPN">
                  <span className="font-mono">{site.tls.alpn}</span>
                </Row>
              )}
              {site.http && (
                <Row label="Edge / CDN">
                  {site.http.cdn ?? 'none detected'}
                  {site.http.server ? ` · ${site.http.server}` : ''}
                </Row>
              )}
            </dl>
          </Card>

          <Card>
            <CardTitle icon="shield">Certificate</CardTitle>
            {site.cert && (
              <dl className="mt-4 divide-y divide-line text-sm">
                <Row label="Quantum status">{t('cert.quantumStatus')}</Row>
                <Row label="Key">
                  <span className="font-mono">{certAlgorithm(site.cert)}</span>
                </Row>
                <Row label="Signature">
                  <span className="font-mono">{site.cert.signatureAlgorithm}</span>
                </Row>
                <Row label="Issuer">{issuerName(site.cert.issuer)}</Row>
                <Row label="Valid until">{formatDate(site.cert.notAfter)}</Row>
                <Row label="Chain signatures">
                  <span className="font-mono text-xs">
                    {site.cert.chainSignatureAlgorithms.join(', ') || '—'}
                  </span>
                </Row>
                <Row label="Chain validation">
                  {site.cert.valid ? (
                    <Pill tone="safe">valid</Pill>
                  ) : (
                    <Pill tone="danger">did not validate</Pill>
                  )}
                </Row>
              </dl>
            )}
          </Card>
        </div>
      )}

      {site.probes && (
        <Card>
          <CardTitle icon="search">What we observed</CardTitle>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Probe results">
            {PROBES.map((p) => {
              const o = site.probes![p.key];
              const good = o.ok === p.goodWhenOk;
              return (
                <li key={p.key} className="flex gap-3 rounded-xl border border-line p-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${good ? 'bg-accent-soft text-accent' : 'bg-exposed-soft text-exposed'}`}
                  >
                    <Icon
                      name={o.ok ? 'check' : 'x'}
                      className="h-4 w-4"
                      label={o.ok ? 'completed' : 'no handshake'}
                    />
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="ml-2 text-xs text-muted">
                      {o.ok ? 'completed' : 'no handshake'}
                      {o.detail ? ` · ${o.detail}` : ''}
                    </span>
                    <span className="block text-muted">{p.desc}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {fixes.length > 0 && (
        <Card>
          <CardTitle icon="sparkles">What to fix — for the site owner</CardTitle>
          <ol className="mt-5 space-y-6">
            {fixes.map((f, i) => (
              <li key={f.id} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-fg">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.why}</p>
                  {f.steps.length > 0 && (
                    <ul className="mt-3 space-y-3 text-sm">
                      {f.steps.map((s, j) => (
                        <li key={j}>
                          {s.label}
                          {s.code && <CodeBlock code={s.code} label={s.label} />}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {site.grade && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle icon="alert">Classical hygiene</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Shown separately; these do not change the quantum grade.
            </p>
            {site.hygieneFlags.length ? (
              <ul className="mt-3 space-y-1.5 text-sm">
                {site.hygieneFlags.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 inline-block h-2 w-2 rounded-full bg-exposed"
                    />
                    {t(`flags.${f}`)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Icon name="check" className="h-4 w-4 text-accent" /> No classical hygiene flags.
              </p>
            )}
          </Card>
          <Card>
            <CardTitle icon="info">{t('hndl.label')}</CardTitle>
            <p className="mt-3 text-sm">{t('hndl.help')}</p>
            <p className="mt-2 font-mono text-xs text-muted">{HNDL_FORMULA}</p>
            <p className="mt-2 text-xs text-muted">
              Inputs: grade {site.grade}; data shelf life {site.shelfLifeYears} years (shelf ={' '}
              {Math.min(1, site.shelfLifeYears / 25).toFixed(2)}); {sectorLabel(site.sector)} weight{' '}
              {SECTOR_WEIGHTS[site.sector] ?? SECTOR_WEIGHTS.other}.
            </p>
          </Card>
        </div>
      )}

      {history && (
        <Card>
          <CardTitle icon="chart">History</CardTitle>
          <div className="mt-4">
            <HistoryChart history={history} />
          </div>
        </Card>
      )}

      {!live && site.grade && (
        <Card>
          <CardTitle icon="layers">Embed the badge</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Served from the latest weekly scan — no live scanning per view.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/badge?host=${site.host}`}
            alt={`quantum-safe TLS badge for ${site.host}`}
            className="mt-4 h-5"
          />
          <div className="mt-4 space-y-3">
            <CopyField label="Markdown" value={`[![quantum-safe TLS](${badgeURL})](${pageURL})`} />
            <CopyField
              label="HTML"
              value={`<a href="${pageURL}"><img src="${badgeURL}" alt="quantum-safe TLS grade"></a>`}
            />
          </div>
        </Card>
      )}

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Icon name="clock" className="h-4 w-4" />
        Think this result is out of date?
        <a href={scanRequestURL(site.host)} className="font-medium text-accent underline">
          Request a re-scan
        </a>
        (opens a prefilled GitHub issue).
      </p>
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
