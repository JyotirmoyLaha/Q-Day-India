import type { Metadata } from 'next';
import Link from 'next/link';
import { QdayCalculator } from '@/components/QdayCalculator';

export const metadata: Metadata = {
  title: 'Q-Day calculator',
  description:
    "Mosca's inequality: is your data's secrecy period longer than the time left before a quantum computer arrives?",
};

export default function QdayPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">When is your Q-Day?</h1>
        <p className="mt-3 max-w-3xl text-muted">
          Michele Mosca&apos;s rule of thumb: if the years your data must stay secret (X) plus the years your
          migration takes (Y) exceed the years until a cryptographically relevant quantum computer exists (Z),
          recorded data will become readable while it still matters. Move the sliders, or{' '}
          <Link href="/org" className="underline">
            pre-fill Y from your code
          </Link>
          .
        </p>
      </header>
      <QdayCalculator />
    </div>
  );
}
