// Deployment-specific values. Set these in Vercel → Settings → Environment Variables
// (or run `node scripts/set-owner.mjs <github-owner> <site-url>` once).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://qday-india.vercel.app').replace(
  /\/$/,
  '',
);
export const REPO_SLUG = process.env.NEXT_PUBLIC_REPO_SLUG ?? 'JyotirmoyLaha/Q-Day-India';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'qday-india@example.org';
export const USER_AGENT = `QDayIndiaScanner/1.0 (+${SITE_URL}/about/scanner)`;

/** Prefilled GitHub issue asking the weekly pipeline to scan a host (on-demand.yml). */
export function scanRequestURL(host: string): string {
  const q = new URLSearchParams({
    title: `scan-request: ${host}`,
    labels: 'scan-request',
    body: `host: ${host}\n\n<!-- The on-demand workflow scans this host once and replies with the result. -->`,
  });
  return `${REPO_URL}/issues/new?${q}`;
}
