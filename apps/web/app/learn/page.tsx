import type { Metadata } from 'next';
import Link from 'next/link';
import { HndlDiagram } from '@/components/HndlDiagram';
import { ShorDemo } from '@/components/ShorDemo';

export const metadata: Metadata = {
  title: 'Learn: quantum computers and your encryption',
  description: 'A plain-language primer on Shor, Grover, harvest-now-decrypt-later, ML-KEM, ML-DSA and Mosca’s inequality.',
};

export default function LearnPage() {
  return (
    <article className="prose-qd mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Quantum computers and your encryption, in ten minutes</h1>
      <p className="text-lg text-muted">
        No physics required. What changes, what doesn&apos;t, and why the clock is already running.
      </p>

      <h2>The short version</h2>
      <p>
        Almost every secure connection on the internet starts with <strong>public-key cryptography</strong>: RSA,
        Diffie-Hellman or elliptic curves (ECDH, ECDSA, Ed25519). They agree on a secret key and prove who is who. A
        large enough quantum computer running <strong>Shor&apos;s algorithm</strong> breaks all of them.
      </p>
      <p>
        Nobody has such a machine yet. But an attacker doesn&apos;t need one today: they can <strong>record encrypted
        traffic now and decrypt it later</strong>, once the machine exists. That is &ldquo;harvest now, decrypt
        later&rdquo;.
      </p>

      <HndlDiagram />

      <h2>What breaks, what bends, what&apos;s fine</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Algorithm</th>
            <th scope="col">Against a quantum computer</th>
            <th scope="col">What to do</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>RSA, DH, DSA, ECDH, ECDSA, Ed25519, X25519</td><td>Broken (Shor)</td><td>Move to ML-KEM / ML-DSA (hybrid first)</td></tr>
          <tr><td>AES-128</td><td>Weakened to ~64-bit in theory (Grover)</td><td>Prefer AES-256 for long-lived data</td></tr>
          <tr><td>AES-256, SHA-256, SHA-384, SHA-3</td><td>Fine</td><td>Keep</td></tr>
          <tr><td>MD5, SHA-1, DES, 3DES, RC4, RSA &lt; 2048</td><td>Already weak today, quantum or not</td><td>Replace first</td></tr>
        </tbody>
      </table>

      <h2>The new standards</h2>
      <p>In August 2024 the US National Institute of Standards and Technology (NIST) finalised three post-quantum standards:</p>
      <ul>
        <li><strong>ML-KEM</strong> (FIPS 203): agrees on a shared key. It replaces RSA/ECDH key exchange.</li>
        <li><strong>ML-DSA</strong> (FIPS 204): digital signatures. It replaces RSA/ECDSA signatures.</li>
        <li><strong>SLH-DSA</strong> (FIPS 205): hash-based signatures, conservative, for long-lived roots of trust.</li>
      </ul>
      <p>
        On the web the transition has already begun. Browsers, Cloudflare, Google and many CDNs use the hybrid key exchange{' '}
        <strong>X25519MLKEM768</strong> (IANA codepoint 4588, standardised in RFC 10024). It combines classical X25519 with
        ML-KEM-768, so it is at least as strong as either one. It needs TLS 1.3. OpenSSL 3.5, Go 1.24+, Node.js 24.5+ and
        JDK 27 support it.
      </p>
      <p>
        <strong>Certificates are a different story.</strong> No public certificate authority issues post-quantum
        certificates yet, so every website, including the best-prepared ones, still has an RSA or ECDSA certificate. A
        site <em>can</em> protect its traffic from harvest-now-decrypt-later today. It <em>cannot</em> yet have a
        post-quantum certificate. Our grades reflect exactly that.
      </p>

      <h2>Why it matters for India</h2>
      <p>
        Banking, health, identity and government records stay sensitive for decades. India&apos;s National Quantum
        Mission set up a Task Force whose report, <em>Implementation of Quantum Safe Ecosystem in India</em> (February
        2026), lays out a phased migration. Critical infrastructure builds foundations (inventory, cryptographic bills of
        materials, pilots) from 2027, migrates high-priority systems by 2028 and reaches full adoption by 2029. Other
        enterprises follow by 2028, 2030 and 2033.
      </p>

      <h2>Are you already late? Mosca&apos;s inequality</h2>
      <p>
        Take <strong>X</strong> = how many years your data must stay secret, <strong>Y</strong> = how many years your
        migration will take, and <strong>Z</strong> = how many years until a cryptographically relevant quantum computer.
        If <strong>X + Y &gt; Z</strong>, data you send today will still matter when it can be decrypted.{' '}
        <Link href="/qday">Try the calculator</Link>.
      </p>

      <h2>How Shor&apos;s algorithm factors 15</h2>
      <p>
        The quantum part of Shor&apos;s algorithm does one thing very fast: it finds the <em>period</em> of the sequence
        a<sup>x</sup> mod N. The rest is ordinary arithmetic. Here it is for N = 15, small enough to do by hand:
      </p>
      <ShorDemo />

      <h2>What you can do this week</h2>
      <ol>
        <li><Link href="/index">Check your website&apos;s grade</Link>. Enabling X25519MLKEM768 is often a configuration change or a CDN setting.</li>
        <li><Link href="/code">Scan your code</Link> to build a cryptographic inventory (CBOM). It runs in your browser.</li>
        <li>Make algorithm choices configurable in one place (crypto-agility), so the next change is cheap.</li>
      </ol>
    </article>
  );
}
