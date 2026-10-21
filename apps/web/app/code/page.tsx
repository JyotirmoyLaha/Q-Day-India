import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeScanner } from '@/components/code/CodeScanner';

export const metadata: Metadata = {
  title: 'QuantumBOM — scan your code',
  description:
    'Find quantum-vulnerable cryptography in a repository, privately in your browser, and export a CycloneDX CBOM.',
};

export default function CodePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent">QuantumBOM</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">
          Find the classical crypto in your code
        </h1>
        <p className="mt-3 max-w-3xl text-muted">
          RSA, elliptic curves and Diffie-Hellman will be breakable by a future quantum computer. QuantumBOM
          finds them in source code, configs, keys and dependency manifests, explains each one with a
          copy-paste fix, and exports a CycloneDX 1.6 cryptographic bill of materials (CBOM).
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent bg-accent-soft px-3 py-1 text-sm">
          <span aria-hidden="true">🔒</span> Runs 100% in your browser. Your code is never uploaded.{' '}
          <Link href="/about#code" className="underline">
            How it works
          </Link>
        </p>
      </header>
      <CodeScanner />
    </div>
  );
}
