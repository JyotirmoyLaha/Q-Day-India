import type { Metadata } from 'next';
import { LiveCheck } from '@/components/LiveCheck';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Check a website',
  description: 'Live post-quantum TLS check of any public hostname: grade, HNDL exposure and what to fix.',
};

export default function CheckPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Live check"
        icon="globe"
        title="Check any website"
        lead="A live check of a public hostname's TLS key exchange: the same handshakes as the weekly index, run once now. Only public hostnames on port 443 are accepted; results are cached for 24 hours."
      />
      <LiveCheck />
    </div>
  );
}
