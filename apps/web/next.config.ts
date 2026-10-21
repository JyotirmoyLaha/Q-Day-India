import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// The CSP is the technical guarantee behind "your code never leaves the browser":
// the page may only talk to its own origin and GitHub (for public-repo scans).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.github.com https://raw.githubusercontent.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@qday/cbom-engine'],
  // Stop `next dev` from writing an AGENTS.md when an AI agent starts it.
  agentRules: false,
  // /index used to be the Readiness Index, but on Vercel the static file for /index
  // (index.html) collided with the home page. The index now lives at /readiness.
  async redirects() {
    return [{ source: '/index', destination: '/readiness', permanent: true }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/tree-sitter/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default config;
