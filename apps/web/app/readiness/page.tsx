import type { Metadata } from 'next';
import Link from 'next/link';
import { getSites, latestScanDate, SHOW_UNVERIFIED } from '@/lib/data';
import { t } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import { IndexTable, type IndexRow } from '@/components/IndexTable';
import { SECTORS } from '@/lib/types';

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
  const unverified = sites.filter((s) => !s.verified).length;

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{t('index.title')}</h1>
      <p className="mt-3 max-w-3xl text-muted">{t('index.intro')}</p>
      <p className="mt-2 text-sm text-muted">
        Last scan: {formatDate(latestScanDate())}. Grades: A+/A use quantum-safe key exchange by default · B
        supports it but not by default · C/D are not yet quantum-safe · F means legacy-only TLS or an invalid
        chain.{' '}
        <Link href="/about#grading" className="underline">
          How grades work
        </Link>
      </p>
      {SHOW_UNVERIFIED && unverified > 0 && (
        <p className="mt-3 rounded-lg border border-dashed border-line bg-subtle px-4 py-3 text-sm text-muted">
          {unverified} of {sites.length} hostnames are marked <strong>unverified</strong>: they were drafted
          from public information and are waiting for a maintainer to confirm that they belong to the
          organisation shown.
        </p>
      )}
      <div className="mt-8">
        <IndexTable rows={rows} scannedAt={latestScanDate()} sectors={sectors} />
      </div>
    </div>
  );
}
