// Prioritised migration plan for the organisation report (§7.1): public TLS first,
// then key exchange in code, then signatures, then hashes/symmetric. Each step is
// mapped to a phase of India's DST Task Force roadmap.
import type { Finding, ScanReport } from '@qday/cbom-engine';
import type { Sector, SiteResult } from './types';
import { siteFixes } from './siteFixes';

export type Track = 'cii' | 'enterprise';

export const DST_PHASES = {
  foundations: {
    name: 'Build Foundations',
    cii: 2027,
    enterprise: 2028,
    summary: 'Governance, cryptographic inventory (CBOM), PQC/hybrid pilots, PQC in procurement.',
  },
  highPriority: {
    name: 'Migrate High-Priority',
    cii: 2028,
    enterprise: 2030,
    summary:
      '"No new classical-only" systems, PKI/HSM/KMS upgrades, PQC digital signatures for high-priority systems.',
  },
  full: {
    name: 'Full PQC Adoption',
    cii: 2029,
    enterprise: 2033,
    summary:
      'Enterprise-wide PQC/hybrid, quantum-safe trust chains and signatures, continuous algorithm governance.',
  },
} as const;
export type PhaseKey = keyof typeof DST_PHASES;

/** Sectors the roadmap treats as Critical Information Infrastructure by default (user can switch). */
export function defaultTrack(sector: Sector | undefined): Track {
  return sector === 'telecom' || sector === 'government' ? 'cii' : 'enterprise';
}

export type PlanItem = {
  order: number;
  area:
    | 'Public TLS'
    | 'Inventory'
    | 'Key exchange in code'
    | 'Signatures & certificates'
    | 'Hashes & legacy ciphers'
    | 'Symmetric strength';
  title: string;
  detail: string;
  count?: number;
  phase: PhaseKey;
  deadline: number;
  files?: string[];
};

const uniqFiles = (fs: Finding[]) => [...new Set(fs.map((f) => f.file))].slice(0, 6);

export function buildPlan(site: SiteResult | null, code: ScanReport | null, track: Track): PlanItem[] {
  const items: Omit<PlanItem, 'order' | 'deadline'>[] = [];

  if (site?.reachable) {
    for (const f of siteFixes(site).filter((x) => x.id !== 'pq-certs')) {
      items.push({
        area: 'Public TLS',
        title: `${site.host}: ${f.title}`,
        detail: f.why,
        phase:
          f.id === 'enable-pq-kex' ||
          f.id === 'enable-tls13' ||
          f.id === 'disable-legacy' ||
          f.id === 'cert-chain'
            ? 'foundations'
            : 'highPriority',
      });
    }
  }

  items.push({
    area: 'Inventory',
    title: code
      ? 'Keep the CBOM current: export it from this report and regenerate it in CI'
      : 'Create a cryptographic inventory (CBOM) of your code',
    detail:
      'The roadmap starts with an inventory of cryptographic assets, and CBOMs are expected from vendors. The GitHub Action produces one on every push.',
    phase: 'foundations',
  });

  if (code) {
    const high = code.findings.filter((f) => f.quantumRisk === 'HIGH');
    const kex = high.filter(
      (f) => f.primitive === 'key-agreement' || f.primitive === 'kem' || f.primitive === 'pke',
    );
    const sig = high.filter((f) => f.primitive === 'signature');
    const broken = code.findings.filter((f) => f.quantumRisk === 'CLASSICAL_BROKEN');
    const low = code.findings.filter((f) => f.quantumRisk === 'LOW');
    if (broken.length)
      items.push({
        area: 'Hashes & legacy ciphers',
        title: 'Remove already-weak cryptography (MD5, SHA-1, DES/3DES, RC4, short RSA, TLS 1.0/1.1)',
        detail: 'These are weak against classical attacks today, so fix them before any post-quantum work.',
        count: broken.length,
        files: uniqFiles(broken),
        phase: 'foundations',
      });
    if (kex.length)
      items.push({
        area: 'Key exchange in code',
        title: 'Move key establishment and encryption to hybrid ML-KEM (X25519MLKEM768 in TLS)',
        detail:
          'RSA encryption, ECDH and DH protect data that can be harvested now and decrypted later. These come first among code changes.',
        count: kex.length,
        files: uniqFiles(kex),
        phase: 'highPriority',
      });
    if (sig.length)
      items.push({
        area: 'Signatures & certificates',
        title: 'Make signing algorithms configurable and plan ML-DSA for long-lived signatures',
        detail:
          'Signatures (JWT, code/document signing, internal PKI) need PQC signatures in the high-priority phase and everywhere by full adoption.',
        count: sig.length,
        files: uniqFiles(sig),
        phase: 'highPriority',
      });
    if (low.length)
      items.push({
        area: 'Symmetric strength',
        title: 'Prefer 256-bit symmetric keys for long-lived data',
        detail: "AES-128 is only theoretically weakened by Grover's algorithm. Low priority.",
        count: low.length,
        files: uniqFiles(low),
        phase: 'full',
      });
  }

  items.push({
    area: 'Signatures & certificates',
    title: 'Prepare PKI for post-quantum certificates',
    detail:
      'Public WebPKI certificates cannot be post-quantum yet. Automate issuance and keep certificate algorithms configurable so the switch is a configuration change.',
    phase: 'full',
  });

  const AREA_ORDER: PlanItem['area'][] = [
    'Public TLS',
    'Inventory',
    'Hashes & legacy ciphers',
    'Key exchange in code',
    'Signatures & certificates',
    'Symmetric strength',
  ];
  const PHASE_ORDER: PhaseKey[] = ['foundations', 'highPriority', 'full'];
  // Array.prototype.sort is stable, so items within the same area and phase keep insertion order.
  return [...items]
    .sort(
      (a, b) =>
        AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area) ||
        PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase),
    )
    .map((i, n) => ({ ...i, order: n + 1, deadline: DST_PHASES[i.phase][track] }));
}
