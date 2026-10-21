import type { Metadata } from 'next';
import Link from 'next/link';
import { HNDL_FORMULA, SECTOR_WEIGHTS, SHELF_DEFAULTS } from '@/lib/grading';
import { sectorLabel, t } from '@/lib/i18n';
import { SECTORS, GRADES } from '@/lib/types';
import { REPO_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Q-Day India grades websites and code, the scoring formulas, limitations and sources.',
};

const SOURCES = [
  {
    title: 'DST Task Force — Implementation of Quantum Safe Ecosystem in India (Feb 2026)',
    href: 'https://dst.gov.in/quantum-safe-ecosystem-in-india',
  },
  { title: 'NIST FIPS 203 — ML-KEM', href: 'https://csrc.nist.gov/pubs/fips/203/final' },
  { title: 'NIST FIPS 204 — ML-DSA', href: 'https://csrc.nist.gov/pubs/fips/204/final' },
  { title: 'NIST FIPS 205 — SLH-DSA', href: 'https://csrc.nist.gov/pubs/fips/205/final' },
  {
    title: 'IETF draft-ietf-tls-ecdhe-mlkem (hybrid ML-KEM key agreement for TLS 1.3)',
    href: 'https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/',
  },
  {
    title: 'OpenSSL 3.5 release notes (ML-KEM, default X25519MLKEM768 key share)',
    href: 'https://github.com/openssl/openssl/releases',
  },
  {
    title: 'Go crypto/tls: X25519MLKEM768 by default (Go 1.24+)',
    href: 'https://github.com/golang/go/issues/69985',
  },
  {
    title: 'Cloudflare — post-quantum support matrix',
    href: 'https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/',
  },
  { title: 'CycloneDX 1.6 JSON reference (CBOM)', href: 'https://cyclonedx.org/docs/1.6/json/' },
  { title: 'SARIF 2.1.0 (OASIS)', href: 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/' },
  {
    title: 'IANA TLS Supported Groups registry',
    href: 'https://www.iana.org/assignments/tls-parameters/tls-parameters.xhtml#tls-parameters-8',
  },
];

export default function AboutPage() {
  return (
    <div className="prose-qd mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Methodology</h1>
      <p className="text-lg text-muted">
        Q-Day India measures two halves of the post-quantum migration: the key exchange that protects traffic
        to public websites, and the cryptography inside code. This page explains every number on the site.
      </p>

      <h2 id="grading">Website grade: quantum key exchange</h2>
      <p>
        Each host gets five TLS handshakes and one HEAD request (<Link href="/about/scanner">details</Link>).
        The headline grade reflects <strong>key exchange only</strong>, because key exchange is what protects
        recorded traffic from future decryption (&ldquo;harvest now, decrypt later&rdquo;).
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Grade</th>
            <th scope="col">Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A+</td>
            <td>
              Supports X25519MLKEM768, negotiates a post-quantum hybrid by default, and TLS 1.0/1.1 are
              disabled
            </td>
          </tr>
          <tr>
            <td>A</td>
            <td>As A+, but TLS 1.0/1.1 still accepted</td>
          </tr>
          <tr>
            <td>B</td>
            <td>A post-quantum hybrid is supported but not negotiated by default</td>
          </tr>
          <tr>
            <td>C</td>
            <td>TLS 1.3 without post-quantum key exchange</td>
          </tr>
          <tr>
            <td>D</td>
            <td>TLS 1.2 is the highest version</td>
          </tr>
          <tr>
            <td>F</td>
            <td>Only TLS below 1.2, or the certificate chain did not validate</td>
          </tr>
          <tr>
            <td>—</td>
            <td>Not reachable: the error is shown and no grade is given</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Certificates.</strong> Every certificate on the public web is still classical (RSA or ECDSA).
        Public CAs and browsers do not support post-quantum (ML-DSA) certificates yet. So the certificate
        status is always &ldquo;{t('cert.quantumStatus')}&rdquo; and does not affect the grade. A site can
        protect its traffic today with post-quantum key exchange, but it cannot yet get a post-quantum
        certificate.
      </p>
      <p>
        <strong>Classical hygiene flags</strong> are shown separately and never change the quantum grade: RSA
        key under 2048 bits, SHA-1 in the chain, certificate expiring within 14 days, missing HSTS, TLS
        1.0/1.1 enabled.
      </p>

      <h2 id="hndl">Harvest-Now-Decrypt-Later exposure (0–100)</h2>
      <pre>
        <code>{`exposure = 1.0 for grades C/D/F, 0.3 for B, 0 for A/A+
shelf    = clamp(shelf_life_years / 25, 0, 1)
${HNDL_FORMULA}`}</code>
      </pre>
      <table>
        <thead>
          <tr>
            <th scope="col">Sector</th>
            <th scope="col">Default data shelf life (years)</th>
            <th scope="col">Sector weight</th>
          </tr>
        </thead>
        <tbody>
          {SECTORS.map((s) => (
            <tr key={s}>
              <td>{sectorLabel(s)}</td>
              <td>{SHELF_DEFAULTS[s]}</td>
              <td>{SECTOR_WEIGHTS[s]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        The score is a prioritisation aid, not a measurement of any specific data. Shelf lives are sector
        defaults. Organisations can override them in the target list.
      </p>

      <h2 id="code">Code scores: QuantumBOM</h2>
      <p>
        The <Link href="/code">code scanner</Link> runs entirely in your browser. It parses source files with
        tree-sitter, uses pattern rules for configs and manifests, and decodes key and certificate files
        locally. Each finding records the algorithm, primitive, quantum risk (HIGH = broken by Shor&apos;s
        algorithm, LOW = weakened by Grover&apos;s, CLASSICAL_BROKEN = already weak today) and a confidence
        level.
      </p>
      <ul>
        <li>
          <strong>Quantum Exposure (0–100)</strong>: a weighted sum of findings, normalised by repository size
          on a logarithmic curve. Weights: key agreement and KEM 10, public-key encryption and signatures 8,
          classically broken 3, Grover-affected 1. Formula:{' '}
          <code>100 × (1 − e^(−weighted / (6 × log2(2 + files))))</code>, where &ldquo;weighted&rdquo; is
          confidence-adjusted (high 1, medium 0.7, low 0.4).
        </li>
        <li>
          <strong>Crypto-Agility (0–100)</strong>: higher when algorithm choices live in one place. Computed
          as <code>100 × (1 − (files with hardcoded algorithms − 1) / hardcoded findings)</code>. 100 means
          every hardcoded choice sits in one file.
        </li>
      </ul>
      <p>
        Results export as a CycloneDX 1.6 CBOM (cryptographic bill of materials), SARIF 2.1.0 for GitHub Code
        Scanning, or Markdown.
      </p>

      <h2 id="limitations">Limitations</h2>
      <ul>
        <li>TLS checks see only the public edge (often a CDN), not internal or back-end connections.</li>
        <li>Certificates cannot be post-quantum yet; grades reflect key exchange only.</li>
        <li>
          Static code analysis has false positives, and it misses dynamic crypto (algorithm names built at
          runtime). Confidence levels are shown with every finding.
        </li>
        <li>
          Timelines for a cryptographically relevant quantum computer are uncertain. The{' '}
          <Link href="/qday">Q-Day calculator</Link> lets you choose your own estimate.
        </li>
        <li>
          The target list was drafted from public information. Hostnames marked <em>unverified</em> have not
          yet been confirmed to belong to the organisation shown.
        </li>
        <li>
          A single weekly snapshot can miss configuration that differs by region, edge node or time of day.
        </li>
      </ul>

      <h2 id="wording">How we write about results</h2>
      <p>
        Quantum risk is about <em>future</em> decryption. We describe sites as &ldquo;using quantum-safe key
        exchange&rdquo; or &ldquo;not yet quantum-safe&rdquo;, and every low grade comes with a fix. A low
        grade does not mean a site has been attacked, or that any data has been exposed.
      </p>

      <h2 id="sources">Sources</h2>
      <ul>
        {SOURCES.map((s) => (
          <li key={s.href}>
            <a href={s.href}>{s.title}</a>
          </li>
        ))}
      </ul>
      <p>
        Data, code and scoring are open source: <a href={REPO_URL}>{REPO_URL}</a>. Grades in this list:{' '}
        {GRADES.join(', ')}.
      </p>
    </div>
  );
}
