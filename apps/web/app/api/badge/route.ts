// README badge (§7.3). Served from build-time scan data — never scans. Node runtime (Edge is
// deprecated in Next 16); responses are cached at Vercel's CDN via Cache-Control.
import badges from '@/generated/badges.json';
import repos from '@/generated/repos.json';
import { badgeFor, type BadgeData } from '@/lib/badge';

export const runtime = 'nodejs';

const data = { hosts: badges, repos } as unknown as BadgeData;

export function GET(req: Request) {
  const { svg, found } = badgeFor(new URL(req.url).searchParams, data);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': found
        ? 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
        : 'public, max-age=300, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
