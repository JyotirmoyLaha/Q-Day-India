import type { Metadata } from 'next';
import { CONTACT_EMAIL, REPO_URL, USER_AGENT } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Responsible scanning & opt-out',
  description: 'What the Q-Day India scanner checks, what it never does, its User-Agent, and how to opt out.',
};

export default function ScannerPage() {
  return (
    <div className="prose-qd card mx-auto max-w-3xl p-6 sm:p-10">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Responsible scanning</h1>
      <p className="text-lg text-muted">
        The Q-Day India scanner makes the same kind of connection any browser makes. It measures which
        key-exchange methods a public website offers. It does not look for weaknesses, log in or read content.
      </p>

      <h2>What is checked</h2>
      <ul>
        <li>
          <strong>Five TLS handshakes</strong> to port 443 of the listed hostname, each with different client
          settings (default, post-quantum only, alternative post-quantum hybrids, TLS 1.3 only, TLS 1.0/1.1
          only). Each handshake completes or is declined, and the connection is closed.
        </li>
        <li>
          <strong>
            One HTTPS <code>HEAD /</code> request
          </strong>{' '}
          to read the <code>Strict-Transport-Security</code>, <code>Server</code> and CDN headers. At most 3
          redirects are followed, and only on the same hostname.
        </li>
        <li>
          From the certificate the server presents to everyone: key algorithm and size, signature algorithm,
          issuer and expiry date.
        </li>
      </ul>
      <p>
        <strong>How often:</strong> once a week (Monday, 08:47 IST) from GitHub Actions. On a single host,
        probes run one at a time with a 300 ms pause and a 10 s timeout; at most 8 hosts are scanned in
        parallel.
      </p>

      <h2>What is never done</h2>
      <ul>
        <li>No port scanning: port 443 on the listed hostname only.</li>
        <li>No penetration testing, exploitation, fuzzing or load testing.</li>
        <li>No login attempts, form submissions or crawling beyond the listed hostname.</li>
        <li>
          No scanning of private, internal or cloud-metadata addresses. Hostnames resolving to them are
          refused.
        </li>
        <li>
          No claims that a site is compromised or that any data is exposed. Results describe key exchange
          only.
        </li>
      </ul>

      <h2>User-Agent</h2>
      <p>The HEAD request identifies itself as:</p>
      <pre>
        <code>{USER_AGENT}</code>
      </pre>
      <p>
        TLS handshakes carry no User-Agent. They come from GitHub Actions runners (Microsoft Azure address
        ranges).
      </p>

      <h2>On-demand checks</h2>
      <p>
        Visitors can request a live check of any public hostname. That runs the same handshakes once, from
        Vercel&apos;s infrastructure, under the same rules. Results are cached for 24 hours, so repeated
        requests don&apos;t repeat the scan.
      </p>

      <h2 id="opt-out">Opting out</h2>
      <p>If you run a site and would prefer it not be scanned:</p>
      <ol>
        <li>
          Open an issue at{' '}
          <a href={`${REPO_URL}/issues/new?labels=opt-out&title=opt-out:%20`}>{REPO_URL}/issues</a> with the
          hostname, or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
        <li>
          The hostname is added to <code>targets/optout.txt</code>. A line starting with a dot (e.g.{' '}
          <code>.example.in</code>) covers a whole domain. Opted-out hosts are skipped by the weekly scan and
          are dropped from the published data from the next scan on.
        </li>
      </ol>
      <p>
        Corrections are also welcome. If a hostname is listed under the wrong organisation, or a result looks
        wrong, please open an issue.
      </p>
    </div>
  );
}
