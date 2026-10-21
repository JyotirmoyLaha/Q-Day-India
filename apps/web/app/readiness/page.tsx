import type { Metadata } from 'next';
import Link from 'next/link';
import { getSites, latestScanDate, SHOW_UNVERIFIED } from '@/lib/data';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import { IndexTable, type IndexRow } from '@/components/IndexTable';
import { PageHeader } from '@/components/PageHeader';
import { SECTORS } from '@/lib/types';
import { REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Quantum Readiness Index',
  description:
    'Weekly post-quantum TLS readiness of Indian banks, government portals, payment and education sites.',
};

export default function IndexPage() {
  const sites = getSites();
  const rows: IndexRow[] = sites.map((s) => ({
    host: s.host,
    org: s.org,
    sector: s.sector,
    verified: s.verified,
    grade: s.grade,
    hndlRisk: s.hndlRisk,
    error: s.error?.code,
    history: s.history,
  }));
  const sectors = SECTORS.filter((x) => sites.some((s) => s.sector === x));
  const verified = sites.filter((s) => s.verified).length;

  return (
    <div>
      <PageHeader
        eyebrow={`Weekly scan · ${formatDate(latestScanDate())}`}
        icon="chart"
        title={t('index.title')}
        lead={
          <>
            {t('index.intro')}{' '}
            <Link href="/about#grading" className="text-accent underline">
              How grades work
            </Link>
          </>
        }
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li>
            <strong className="text-fg">A+ / A</strong> quantum-safe by default
          </li>
          <li>
            <strong className="text-fg">B</strong> supported, not default
          </li>
          <li>
            <strong className="text-fg">C / D</strong> not yet quantum-safe
          </li>
          <li>
            <strong className="text-fg">F</strong> legacy-only TLS or invalid chain
          </li>
          {SHOW_UNVERIFIED && (
            <li>
              <strong className="text-fg">{verified}</strong> of {sites.length} hostnames verified (
              <a href={`${REPO_URL}/blob/main/targets/VERIFICATION.md`} className="underline">
                evidence
              </a>
              )
            </li>
          )}
        </ul>
      </PageHeader>
      <IndexTable rows={rows} scannedAt={latestScanDate()} sectors={sectors} />
    </div>
  );
}
