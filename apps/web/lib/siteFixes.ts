// Fix guidance for site owners, derived from a scan result. Pure and shared by
// /site/[host], /check and the /org migration plan.
import type { SiteResult } from './types';

export type SiteFix = {
  id: string;
  priority: 1 | 2 | 3; // 1 = do first
  title: string;
  why: string;
  steps: { label: string; code?: string }[];
};

const CDN_NAMES: Record<string, string> = {
  cloudflare: 'Cloudflare',
  akamai: 'Akamai',
  fastly: 'Fastly',
  cloudfront: 'Amazon CloudFront',
  other: 'your CDN / proxy',
};

export function siteFixes(r: SiteResult): SiteFix[] {
  const fixes: SiteFix[] = [];
  if (!r.reachable || !r.tls) return fixes;
  const cdn = r.http?.cdn ? CDN_NAMES[r.http.cdn] : null;
  const flags = new Set(r.hygieneFlags);

  if (flags.has('CERT_INVALID')) {
    fixes.push({
      id: 'cert-chain',
      priority: 1,
      title: 'Serve a valid certificate chain',
      why: 'Clients could not validate the certificate chain for this hostname, so the connection cannot be trusted regardless of key exchange.',
      steps: [
        {
          label:
            'Install the full chain (leaf + intermediates) from your CA and make sure the certificate covers this hostname.',
        },
        {
          label: 'Check the result with: ',
          code: `openssl s_client -connect ${r.host}:443 -servername ${r.host} -showcerts`,
        },
      ],
    });
  }

  if (r.tls.maxVersion !== 'TLS1.3') {
    fixes.push({
      id: 'enable-tls13',
      priority: 1,
      title: 'Enable TLS 1.3',
      why:
        'Post-quantum key exchange is only defined for TLS 1.3. This host negotiates at most ' +
        r.tls.maxVersion +
        '.',
      steps: [
        { label: 'nginx (OpenSSL ≥ 1.1.1):', code: 'ssl_protocols TLSv1.3 TLSv1.2;' },
        { label: 'Apache httpd:', code: 'SSLProtocol -all +TLSv1.3 +TLSv1.2' },
      ],
    });
  }

  if (!r.tls.pqHybrid.x25519mlkem768 || r.grade === 'B') {
    const pqSteps: SiteFix['steps'] = [];
    if (cdn) {
      pqSteps.push({
        label: `This host appears to be served through ${cdn}. Post-quantum key exchange between browsers and the edge is usually a CDN setting or a plan feature: check ${cdn}'s post-quantum (X25519MLKEM768) documentation first.`,
      });
    }
    pqSteps.push(
      {
        label: 'nginx built against OpenSSL ≥ 3.5 (offer the hybrid first, keep classical fallbacks):',
        code: 'ssl_protocols TLSv1.3 TLSv1.2;\nssl_ecdh_curve X25519MLKEM768:X25519:prime256v1;',
      },
      {
        label: 'Apache httpd with OpenSSL ≥ 3.5:',
        code: 'SSLOpenSSLConfCmd Curves X25519MLKEM768:X25519:prime256v1',
      },
      { label: 'HAProxy with OpenSSL ≥ 3.5:', code: 'ssl-default-bind-curves X25519MLKEM768:X25519:P-256' },
      {
        label:
          'Go services: Go ≥ 1.24 offers X25519MLKEM768 by default — remove any CurvePreferences list that omits it.',
      },
      {
        label: 'Node.js ≥ 24.5 (bundles OpenSSL 3.5):',
        code: "tls.createServer({ ecdhCurve: 'X25519MLKEM768:X25519:prime256v1', ... })",
      },
    );
    fixes.push({
      id: 'enable-pq-kex',
      priority: 1,
      title:
        r.grade === 'B'
          ? 'Prefer the post-quantum hybrid by default'
          : 'Enable hybrid post-quantum key exchange (X25519MLKEM768)',
      why:
        r.grade === 'B'
          ? 'The server supports a post-quantum hybrid, but a default client handshake still lands on a classical group. Put X25519MLKEM768 first in the server preference list.'
          : 'Traffic to this host can be recorded today and decrypted later by a quantum computer (harvest-now-decrypt-later). The hybrid X25519MLKEM768 group is at least as strong as X25519 alone and is already used by all major browsers.',
      steps: pqSteps,
    });
  }

  if (flags.has('LEGACY_TLS')) {
    fixes.push({
      id: 'disable-legacy',
      priority: 2,
      title: 'Turn off TLS 1.0 and 1.1',
      why: 'TLS 1.0/1.1 are deprecated (RFC 8996). Disabling them is required for an A+ grade.',
      steps: [
        { label: 'nginx:', code: 'ssl_protocols TLSv1.3 TLSv1.2;' },
        { label: 'Apache httpd:', code: 'SSLProtocol -all +TLSv1.3 +TLSv1.2' },
        ...(cdn ? [{ label: `On ${cdn}, raise the minimum TLS version to 1.2 in the edge settings.` }] : []),
      ],
    });
  }

  if (flags.has('NO_HSTS')) {
    fixes.push({
      id: 'hsts',
      priority: 3,
      title: 'Send a Strict-Transport-Security header',
      why: 'HSTS stops downgrade to plain HTTP. It does not change the quantum grade but is basic hygiene.',
      steps: [
        {
          label: 'nginx:',
          code: 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
        },
      ],
    });
  }

  if (flags.has('RSA_LT_2048') || flags.has('SHA1_IN_CHAIN') || flags.has('CERT_EXPIRING_SOON')) {
    fixes.push({
      id: 'reissue-cert',
      priority: 2,
      title: 'Re-issue the certificate',
      why:
        [
          flags.has('RSA_LT_2048') && 'the RSA key is shorter than 2048 bits',
          flags.has('SHA1_IN_CHAIN') && 'the chain contains a SHA-1 signature',
          flags.has('CERT_EXPIRING_SOON') && 'it expires within 14 days',
        ]
          .filter(Boolean)
          .join('; ')
          .replace(/^./, (c) => c.toUpperCase()) + '.',
      steps: [
        {
          label:
            'Request an ECDSA P-256 (or RSA-2048+) certificate signed with SHA-256 and automate renewal (e.g. ACME).',
        },
      ],
    });
  }

  fixes.push({
    id: 'pq-certs',
    priority: 3,
    title: 'Plan for post-quantum certificates (no action possible yet)',
    why: 'Public CAs and browsers do not issue or accept ML-DSA certificates yet, so every site on the web still uses classical RSA/ECDSA certificates. Keep certificate automation and algorithm choices configurable so you can switch when they arrive.',
    steps: [],
  });

  return fixes.sort((a, b) => a.priority - b.priority);
}
