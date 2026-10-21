import type { MetadataRoute } from 'next';
import { getSites, getSnapshots, latestScanDate } from '@/lib/data';
import { reportMonths } from '@/lib/report';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = latestScanDate();
  const pages = ['', '/readiness', '/code', '/org', '/qday', '/learn', '/about', '/about/scanner', '/check'];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, lastModified })),
    ...reportMonths(getSnapshots()).map((m) => ({ url: `${SITE_URL}/report/${m}`, lastModified })),
    ...getSites().map((s) => ({ url: `${SITE_URL}/site/${s.host}`, lastModified })),
  ];
}
