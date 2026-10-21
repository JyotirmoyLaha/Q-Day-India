import type { Metadata } from 'next';
import { OrgReport } from '@/components/OrgReport';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Organisation report',
  description:
    'Your public TLS grade and your code’s cryptographic inventory, with a migration plan mapped to India’s quantum-safe roadmap.',
};

export default function OrgPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Organisation report"
        icon="building"
        title="Your website and your code, one migration plan"
        lead="Both halves of the migration in one place: the key exchange your public website offers today, and the classical cryptography inside your code. The result is a prioritised plan mapped to India's DST roadmap, plus a CycloneDX CBOM."
      />
      <OrgReport />
    </div>
  );
}
