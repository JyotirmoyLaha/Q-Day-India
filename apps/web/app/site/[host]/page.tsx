import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSite, getSites } from '@/lib/data';
import { SiteReport } from '@/components/SiteReport';
import { formatDate } from '@/lib/format';

export const dynamicParams = false;

export function generateStaticParams() {
  return getSites().map((s) => ({ host: s.host }));
}

export async function generateMetadata({ params }: { params: Promise<{ host: string }> }): Promise<Metadata> {
  const { host } = await params;
  const s = getSite(host);
  if (!s) return { title: 'Not found' };
  return {
    title: `${s.org} (${s.host})`,
    description: `Quantum key-exchange grade ${s.grade ?? 'not available'} for ${s.host} on ${formatDate(s.scannedAt)}.`,
  };
}

export default async function SitePage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const site = getSite(host);
  if (!site) notFound();
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/index" className="underline">
          Readiness Index
        </Link>{' '}
        / <span className="font-mono">{site.host}</span>
      </nav>
      <SiteReport site={site} scannedAt={site.scannedAt} history={site.history} />
    </div>
  );
}
