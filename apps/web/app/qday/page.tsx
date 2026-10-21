import type { Metadata } from 'next';
import Link from 'next/link';
import { QdayCalculator } from '@/components/QdayCalculator';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Q-Day calculator',
  description:
    "Mosca's inequality: is your data's secrecy period longer than the time left before a quantum computer arrives?",
};

export default function QdayPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Q-Day calculator"
        icon="calculator"
        title="When is your Q-Day?"
        lead={
          <>
            Michele Mosca&apos;s rule of thumb: if the years your data must stay secret (X) plus the years
            your migration takes (Y) exceed the years until a cryptographically relevant quantum computer
            exists (Z), recorded data becomes readable while it still matters. Move the sliders, or{' '}
            <Link href="/org" className="text-accent underline">
              pre-fill Y from your code
            </Link>
            .
          </>
        }
      />
      <QdayCalculator />
    </div>
  );
}
