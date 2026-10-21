import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeScanner } from '@/components/code/CodeScanner';
import { PageHeader } from '@/components/PageHeader';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'QuantumBOM — scan your code',
  description:
    'Find quantum-vulnerable cryptography in a repository, privately in your browser, and export a CycloneDX CBOM.',
};

const FEATURES = [
  'Python, JS/TS, Java, Go (tree-sitter) + Kotlin, C/C++, C#, Rust, PHP',
  'nginx, Apache, HAProxy, OpenSSL, Docker, Terraform, Kubernetes, SSH configs',
  'PEM/OpenSSH keys and certificates (key material is never shown)',
  'CycloneDX 1.6 CBOM, SARIF 2.1.0 and Markdown export',
];

export default function CodePage() {
  return (
    <div>
      <PageHeader
        eyebrow="QuantumBOM"
        icon="code"
        title="Find the classical crypto in your code"
        lead="RSA, elliptic curves and Diffie-Hellman will be breakable by a future quantum computer. QuantumBOM finds them in source code, configs, keys and dependency manifests, explains each one with a copy-paste fix, and exports a cryptographic bill of materials (CBOM)."
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium">
            <Icon name="lock" className="h-4 w-4" />
            Runs 100% in your browser — your code is never uploaded
          </span>
          <Link href="/about#code" className="text-sm text-accent underline">
            How it works
          </Link>
        </div>
        <ul className="mt-5 grid gap-2 text-sm text-muted sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {f}
            </li>
          ))}
        </ul>
      </PageHeader>
      <CodeScanner />
    </div>
  );
}
