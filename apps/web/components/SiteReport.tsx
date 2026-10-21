import type { HistoryPoint, SiteResult } from '@/lib/types';
import { t, sectorLabel } from '@/lib/i18n';
import { certAlgorithm, formatDate, groupLabel, issuerName } from '@/lib/format';
import { HNDL_FORMULA, SECTOR_WEIGHTS } from '@/lib/grading';
import { siteFixes } from '@/lib/siteFixes';
import { SITE_URL, scanRequestURL } from '@/lib/site';
import { GradeChip } from './GradeChip';
import { RiskMeter } from './RiskMeter';
import { HistoryChart } from './HistoryChart';
import { CopyField } from './CopyField';
import { Card, Pill, UnverifiedTag } from './Tags';

const PROBES: { key: keyof NonNullable<SiteResult['probes']>; name: string; desc: string }[] = [
  {
    key: 'default',
    name: 'P1 Default',
    desc: 'Handshake with standard client settings (offers X25519MLKEM768 and classical groups)',
  },
  { key: 'pqOnly', name: 'P2 PQ-only', desc: 'TLS 1.3 offering only X25519MLKEM768' },
  { key: 'pqAlt', name: 'P3 PQ-alt', desc: 'TLS 1.3 offering only SecP256r1MLKEM768 / SecP384r1MLKEM1024' },
  { key: 'tls13', name: 'P4 TLS 1.3', desc: 'TLS 1.3 only' },
  { key: 'legacy', name: 'P5 Legacy', desc: 'TLS 1.0/1.1 only (accepted = penalty)' },
  { key: 'head', name: 'H1 HEAD', desc: 'One HTTPS HEAD / for HSTS and CDN headers' },
];

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

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted">
            {sectorLabel(site.sector)}
            {site.subsector ? ` · ${site.subsector.replace(/_/g, ' ')}` : ''}
            {live ? ' · live scan' : ''}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{site.org}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-muted">
            {site.host}
            {!site.verified && !live && <UnverifiedTag />}
          </p>
          <p className="mt-4 max-w-xl text-base">{t(`grade.${site.grade ?? 'none'}`)}.</p>
          <p className="mt-1 text-sm text-muted">{t('scanDate', { date: formatDate(scannedAt) })}</p>
        </div>
        <div className="flex items-start gap-6">
          <GradeChip grade={site.grade} date={scannedAt} size="lg" />
          {site.grade && (
            <div className="min-w-[12rem]">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('hndl.label')}</p>
              <p className="mt-1 font-serif text-4xl font-semibold tabular-nums">
                {site.hndlRisk}
                <span className="text-lg text-muted">/100</span>
              </p>
              <RiskMeter risk={site.hndlRisk} compact={false} />
            </div>
          )}
        </div>
      </header>

      {!site.reachable && (
        <Card>
          <h2 className="font-serif text-xl font-semibold">Could not be graded</h2>
          <p className="mt-2 text-sm">
            {site.error ? t(`errors.${site.error.code}`) : 'The host did not complete a handshake'} on port
            443. Nothing is implied about the site&apos;s security; it may be down, geo-restricted or not
            serving HTTPS on this hostname.
          </p>
          {site.error?.detail && (
            <p className="mt-2 break-all font-mono text-xs text-muted">{site.error.detail}</p>
          )}
        </Card>
      )}

      {site.tls && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-serif text-xl font-semibold">Key exchange</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Default group</dt>
              <dd className="font-mono">{groupLabel(site.tls.defaultGroup)}</dd>
              <dt className="text-muted">X25519MLKEM768</dt>
              <dd>
                {site.tls.pqHybrid.x25519mlkem768 ? (
                  <Pill tone="safe">supported</Pill>
                ) : (
                  <Pill tone="exposed">not offered</Pill>
                )}
              </dd>
              <dt className="text-muted">Other PQ hybrids</dt>
              <dd>
                {site.tls.pqHybrid.secp256r1mlkem768 || site.tls.pqHybrid.secp384r1mlkem1024
                  ? [
                      site.tls.pqHybrid.secp256r1mlkem768 && 'SecP256r1MLKEM768',
                      site.tls.pqHybrid.secp384r1mlkem1024 && 'SecP384r1MLKEM1024',
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : 'none'}
              </dd>
              <dt className="text-muted">Highest TLS</dt>
              <dd>{site.tls.maxVersion.replace('TLS', 'TLS ')}</dd>
              <dt className="text-muted">TLS 1.0/1.1</dt>
              <dd>
                {site.tls.legacyEnabled ? (
                  <Pill tone="exposed">still accepted</Pill>
                ) : (
                  <Pill tone="safe">disabled</Pill>
                )}
              </dd>
              <dt className="text-muted">Cipher suite</dt>
              <dd className="break-all font-mono text-xs">{site.tls.cipherSuite}</dd>
              {site.tls.alpn && (
                <>
                  <dt className="text-muted">ALPN</dt>
                  <dd className="font-mono">{site.tls.alpn}</dd>
                </>
              )}
              {site.http && (
                <>
                  <dt className="text-muted">Edge / CDN</dt>
                  <dd>
                    {site.http.cdn ? site.http.cdn : 'none detected'}
                    {site.http.server ? ` · ${site.http.server}` : ''}
                  </dd>
                </>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="font-serif text-xl font-semibold">Certificate</h2>
            {site.cert && (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Quantum status</dt>
                <dd>{t('cert.quantumStatus')}</dd>
                <dt className="text-muted">Key</dt>
                <dd className="font-mono">{certAlgorithm(site.cert)}</dd>
                <dt className="text-muted">Signature</dt>
                <dd className="font-mono">{site.cert.signatureAlgorithm}</dd>
                <dt className="text-muted">Issuer</dt>
                <dd>{issuerName(site.cert.issuer)}</dd>
                <dt className="text-muted">Valid until</dt>
                <dd>{formatDate(site.cert.notAfter)}</dd>
                <dt className="text-muted">Chain signatures</dt>
                <dd className="font-mono text-xs">{site.cert.chainSignatureAlgorithms.join(', ') || '—'}</dd>
                <dt className="text-muted">Chain validation</dt>
                <dd>
                  {site.cert.valid ? (
                    <Pill tone="safe">valid</Pill>
                  ) : (
                    <Pill tone="danger">did not validate</Pill>
                  )}
                </dd>
              </dl>
            )}
          </Card>
        </div>
      )}

      {site.probes && (
        <Card>
          <h2 className="font-serif text-xl font-semibold">What we observed</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Probe results</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Probe
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    What it tests
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROBES.map((p) => {
                  const o = site.probes![p.key];
                  return (
                    <tr key={p.key} className="border-b border-line/60">
                      <th scope="row" className="py-2 pr-3 text-left font-medium whitespace-nowrap">
                        {p.name}
                      </th>
                      <td className="py-2 pr-3 text-muted">{p.desc}</td>
                      <td className="py-2 whitespace-nowrap">
                        {o.ok ? 'completed' : 'no handshake'}
                        {o.detail ? (
                          <span className="ml-1 font-mono text-xs text-muted">({o.detail})</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {site.grade && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-serif text-xl font-semibold">Classical hygiene</h2>
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
              <p className="mt-3 text-sm">No classical hygiene flags.</p>
            )}
          </Card>
          <Card>
            <h2 className="font-serif text-xl font-semibold">{t('hndl.label')}</h2>
            <p className="mt-2 text-sm">{t('hndl.help')}</p>
            <p className="mt-2 font-mono text-xs text-muted">{HNDL_FORMULA}</p>
            <p className="mt-2 text-xs text-muted">
              Inputs: grade {site.grade}; data shelf life {site.shelfLifeYears} years (shelf ={' '}
              {Math.min(1, site.shelfLifeYears / 25).toFixed(2)}); {sectorLabel(site.sector)} weight{' '}
              {SECTOR_WEIGHTS[site.sector] ?? SECTOR_WEIGHTS.other}.
            </p>
          </Card>
        </div>
      )}

      {fixes.length > 0 && (
        <Card>
          <h2 className="font-serif text-xl font-semibold">What to fix — for the site owner</h2>
          <ol className="mt-4 space-y-5">
            {fixes.map((f, i) => (
              <li key={f.id} className="grid grid-cols-[1.75rem_1fr] gap-2">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-subtle text-xs font-semibold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.why}</p>
                  {f.steps.length > 0 && (
                    <ul className="mt-2 space-y-2 text-sm">
                      {f.steps.map((s, j) => (
                        <li key={j}>
                          {s.label}
                          {s.code && (
                            <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-subtle p-2.5 font-mono text-xs">
                              <code>{s.code}</code>
                            </pre>
                          )}
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

      {history && (
        <Card>
          <h2 className="font-serif text-xl font-semibold">History</h2>
          <div className="mt-3">
            <HistoryChart history={history} />
          </div>
        </Card>
      )}

      {!live && site.grade && (
        <Card>
          <h2 className="font-serif text-xl font-semibold">Embed the badge</h2>
          <p className="mt-1 text-sm text-muted">
            Served from the latest weekly scan — no live scanning per view.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/badge?host=${site.host}`}
            alt={`quantum-safe TLS badge for ${site.host}`}
            className="mt-3 h-5"
          />
          <div className="mt-3 space-y-3">
            <CopyField label="Markdown" value={`[![quantum-safe TLS](${badgeURL})](${pageURL})`} />
            <CopyField
              label="HTML"
              value={`<a href="${pageURL}"><img src="${badgeURL}" alt="quantum-safe TLS grade"></a>`}
            />
          </div>
        </Card>
      )}

      <p className="text-sm text-muted">
        Think this result is out of date?{' '}
        <a href={scanRequestURL(site.host)} className="underline">
          Request a re-scan
        </a>{' '}
        (opens a prefilled GitHub issue).
      </p>
    </article>
  );
}
