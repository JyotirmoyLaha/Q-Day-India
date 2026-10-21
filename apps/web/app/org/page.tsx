import type { Metadata } from 'next';
import { OrgReport } from '@/components/OrgReport';

export const metadata: Metadata = {
  title: 'Organisation report',
  description:
    'Your public TLS grade and your code’s cryptographic inventory, with a migration plan mapped to India’s quantum-safe roadmap.',
};

export default function OrgPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Organisation report</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Both halves of the migration in one place: the key exchange your public website offers today, and
          the classical cryptography inside your code. The result is a prioritised plan you can take to your
          CISO, and a CycloneDX CBOM.
        </p>
      </header>
      <OrgReport />
    </div>
  );
}
