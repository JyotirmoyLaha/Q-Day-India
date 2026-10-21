// SSRF protection for /api/scan (§5.6). Mirrors scanner/internal/netguard.
// 1. Accept only a bare hostname (no IP literals, ports, paths, userinfo).
// 2. Convert IDN to punycode and validate every label.
// 3. Resolve DNS ourselves; reject if ANY address is non-public.
// 4. The caller connects to one of the returned validated IPs (passing SNI = host),
//    so a second, rebinding DNS answer can never be used.
import { BlockList, isIP } from 'node:net';
import { domainToASCII } from 'node:url';
import dns from 'node:dns/promises';

export class HostError extends Error {
  constructor(
    public reason: 'INVALID_HOST' | 'NON_PUBLIC_ADDRESS' | 'DNS_FAIL',
    message: string,
  ) {
    super(message);
  }
}

const blocked = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
  ['100::', 64],
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
] as const)
  blocked.addSubnet(net, prefix, 'ipv6');

/** True only for globally routable unicast addresses. */
export function isPublicAddress(addr: string): boolean {
  const v = isIP(addr);
  if (v === 0) return false;
  if (v === 6) {
    const mapped =
      /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(addr) ?? /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(addr);
    if (mapped) {
      const v4 = mapped[2] ? hexPairToV4(mapped[1]!, mapped[2]) : mapped[1]!;
      return isPublicAddress(v4);
    }
    return !blocked.check(addr, 'ipv6');
  }
  return !blocked.check(addr, 'ipv4');
}

function hexPairToV4(a: string, b: string) {
  const x = parseInt(a, 16);
  const y = parseInt(b, 16);
  return `${x >> 8}.${x & 255}.${y >> 8}.${y & 255}`;
}

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_TLDS = new Set([
  'localhost',
  'local',
  'internal',
  'intranet',
  'lan',
  'home',
  'corp',
  'test',
  'invalid',
  'example',
  'onion',
  'arpa',
]);

/** Validates a user-supplied hostname and returns its lower-case punycode form. */
export function normalizeHost(raw: unknown): string {
  if (typeof raw !== 'string') throw new HostError('INVALID_HOST', 'Enter a hostname such as example.in.');
  const h = raw.trim().replace(/\.$/, '');
  if (!h || h.length > 253) throw new HostError('INVALID_HOST', 'Enter a hostname such as example.in.');
  if (/[\s/:@?#[\]\\%]/.test(h))
    throw new HostError(
      'INVALID_HOST',
      'Only a bare hostname is accepted — no scheme, port, path or credentials.',
    );
  if (isIP(h)) throw new HostError('INVALID_HOST', 'IP addresses are not accepted; use a hostname.');
  const ascii = domainToASCII(h).toLowerCase();
  if (!ascii) throw new HostError('INVALID_HOST', 'That is not a valid hostname.');
  const labels = ascii.split('.');
  if (labels.length < 2)
    throw new HostError('INVALID_HOST', 'Hostnames must contain a dot (e.g. example.in).');
  if (!labels.every((l) => LABEL.test(l)))
    throw new HostError('INVALID_HOST', 'That is not a valid hostname.');
  const tld = labels[labels.length - 1]!;
  if (/^\d+$/.test(tld) || /^0x[0-9a-f]+$/i.test(tld))
    throw new HostError('INVALID_HOST', 'Numeric hostnames are not accepted.');
  if (RESERVED_TLDS.has(tld))
    throw new HostError('INVALID_HOST', `.${tld} is a reserved, non-public domain.`);
  return ascii;
}

export type Resolver = (host: string) => Promise<string[]>;

export const systemResolver: Resolver = async (host) =>
  (await dns.lookup(host, { all: true, verbatim: true })).map((a) => a.address);

/** Resolves once and returns the addresses only if every one of them is public. */
export async function resolvePublic(host: string, resolver: Resolver = systemResolver): Promise<string[]> {
  let addrs: string[];
  try {
    addrs = await resolver(host);
  } catch {
    throw new HostError('DNS_FAIL', `${host} did not resolve.`);
  }
  if (!addrs.length) throw new HostError('DNS_FAIL', `${host} did not resolve.`);
  const bad = addrs.find((a) => !isPublicAddress(a));
  if (bad)
    throw new HostError(
      'NON_PUBLIC_ADDRESS',
      `${host} resolves to a private or reserved address; only public sites can be scanned.`,
    );
  return addrs;
}
