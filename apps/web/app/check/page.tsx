import type { Metadata } from 'next';
import { LiveCheck } from '@/components/LiveCheck';

export const metadata: Metadata = {
  title: 'Check a website',
  description: 'Live post-quantum TLS check of any public hostname: grade, HNDL exposure and what to fix.',
};

export default function CheckPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Check a website</h1>
        <p className="mt-3 max-w-3xl text-muted">
          A live check of a public hostname&apos;s TLS key exchange: the same handshakes as the weekly index, run once
          now. Only public hostnames on port 443 are accepted.
        </p>
      </header>
      <LiveCheck />
    </div>
  );
}
