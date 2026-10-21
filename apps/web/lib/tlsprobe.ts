// Live TLS probes for /api/scan (Node.js runtime, OpenSSL ≥ 3.5). Same probe set
// as the Go scanner (§5.1); every connection goes to a pre-validated IP with
// SNI = host, port 443 only.
import tls, { type ConnectionOptions, type TLSSocket } from 'node:tls';
import https from 'node:https';
import { X509Certificate } from 'node:crypto';
import type { CDN, Grade, HygieneFlag, Sector, SiteResult } from './types';
import { computeGrade, hndlRisk, shelfLife } from './grading';
import { detectCDN } from './cdn';
import { USER_AGENT } from './site';

export const OPENSSL_MIN = [3, 5];

/** True if the running Node bundles OpenSSL ≥ 3.5 (ML-KEM support). */
export function opensslSupportsPQ(version = process.versions.openssl ?? ''): boolean {
  const [maj = 0, min = 0] = version.split(/[.-]/).map(Number);
  return maj > OPENSSL_MIN[0]! || (maj === OPENSSL_MIN[0] && min >= OPENSSL_MIN[1]!);
}

type Outcome = {
  ok: boolean;
  error?: string;
  code?: string;
  version?: string | null;
  group?: string;
  cipher?: string;
  alpn?: string;
  cert?: X509Certificate;
  chain: X509Certificate[];
  authorized?: boolean;
  authError?: string;
  hostnameError?: string;
};

export type Connector = (opts: ConnectionOptions) => TLSSocket;

const GROUPS_DEFAULT = 'X25519MLKEM768:X25519:prime256v1:secp384r1';

function probe(ip: string, host: string, extra: ConnectionOptions, timeoutMs: number, connect: Connector): Promise<Outcome> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (o: Outcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve(o);
    };
    const socket = connect({ host: ip, servername: host, port: 443, rejectUnauthorized: false, ...extra });
    const timer = setTimeout(() => done({ ok: false, code: 'TIMEOUT', error: 'timed out', chain: [] }), timeoutMs);
    socket.once('secureConnect', () => {
      const eph = socket.getEphemeralKeyInfo() as { name?: string } | null;
      // X509Certificate API only: getPeerCertificate() can come back empty for
      // TLS 1.3 sessions with rejectUnauthorized: false.
      let leaf: X509Certificate | undefined;
      const chain: X509Certificate[] = [];
      let hostnameError: string | undefined;
      try {
        leaf = socket.getPeerX509Certificate();
        const seen = new Set<string>(leaf ? [leaf.fingerprint256] : []);
        let cur = leaf?.issuerCertificate;
        while (cur && !seen.has(cur.fingerprint256)) {
          seen.add(cur.fingerprint256);
          chain.push(cur);
          cur = cur.issuerCertificate;
        }
        if (leaf && !leaf.checkHost(host)) hostnameError = `certificate is not valid for ${host}`;
      } catch (e) {
        hostnameError ??= `certificate could not be read: ${(e as Error).message}`;
      }
      const hostErr = hostnameError ? { message: hostnameError } : undefined;
      done({
        ok: true,
        version: socket.getProtocol(),
        group: eph?.name,
        cipher: socket.getCipher()?.standardName ?? socket.getCipher()?.name,
        alpn: typeof socket.alpnProtocol === 'string' ? socket.alpnProtocol : undefined,
        cert: leaf,
        chain,
        authorized: socket.authorized,
        authError: socket.authorizationError ? String(socket.authorizationError) : undefined,
        hostnameError: hostErr?.message,
      });
    });
    socket.once('error', (e: NodeJS.ErrnoException) => {
      const code = e.code === 'ECONNREFUSED' ? 'REFUSED' : e.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'TLS_FAIL';
      done({ ok: false, code, error: e.message, chain: [] });
    });
  });
}

const VERSION: Record<string, NonNullable<SiteResult['tls']>['maxVersion']> = {
  'TLSv1.3': 'TLS1.3',
  'TLSv1.2': 'TLS1.2',
  'TLSv1.1': 'TLS1.1',
  TLSv1: 'TLS1.0',
};
const GROUP_NAMES: Record<string, string> = { prime256v1: 'P-256', secp384r1: 'P-384', secp521r1: 'P-521', X25519: 'X25519' };

function certInfo(o: Outcome): SiteResult['cert'] {
  const c = o.cert;
  if (!c) return undefined;
  const pk = c.publicKey;
  const d = pk.asymmetricKeyDetails ?? {};
  const type = pk.asymmetricKeyType;
  const keyAlgorithm = type === 'rsa' || type === 'rsa-pss' ? 'RSA' : type === 'ec' ? 'ECDSA' : type === 'ed25519' ? 'Ed25519' : String(type);
  const curve = d.namedCurve ? ({ prime256v1: 'P-256', secp384r1: 'P-384', secp521r1: 'P-521' }[d.namedCurve] ?? d.namedCurve) : undefined;
  const keySize = d.modulusLength ?? (curve ? Number(curve.replace(/\D/g, '')) || 0 : type === 'ed25519' ? 256 : 0);
  const sig = (x: X509Certificate) => (x as X509Certificate & { signatureAlgorithm?: string }).signatureAlgorithm ?? 'unknown';
  const valid = Boolean(o.authorized) && !o.hostnameError;
  return {
    keyAlgorithm,
    keySize,
    ...(curve ? { curve } : {}),
    signatureAlgorithm: sig(c),
    issuer: c.issuer.split('\n').reverse().join(','),
    notAfter: new Date(c.validTo).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    chainSignatureAlgorithms: o.chain.map(sig),
    valid,
    ...(valid ? {} : { validationError: o.hostnameError ?? o.authError ?? 'chain did not validate' }),
  };
}

function head(ip: string, host: string, timeoutMs: number): Promise<SiteResult['http'] | undefined> {
  const seen: Record<string, string | string[] | undefined>[] = [];
  const one = (path: string, hops: number): Promise<void> =>
    new Promise((resolve) => {
      const req = https.request(
        { host: ip, servername: host, port: 443, method: 'HEAD', path, headers: { Host: host, 'User-Agent': USER_AGENT }, rejectUnauthorized: false, timeout: timeoutMs },
        (res) => {
          seen.push(res.headers);
          res.resume();
          const loc = res.headers.location;
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && loc && hops < 3) {
            try {
              const u = new URL(loc, `https://${host}${path}`);
              if (u.protocol === 'https:' && u.hostname === host) return void one(u.pathname + u.search, hops + 1).then(resolve);
            } catch {
              // bad Location header
            }
          }
          resolve();
        },
      );
      req.on('timeout', () => req.destroy());
      req.on('error', () => resolve());
      req.end();
    });
  return one('/', 0).then(() => {
    if (!seen.length) return undefined;
    const hsts = seen.some((h) => /max-age=(?!0\b)\d+/i.test(String(h['strict-transport-security'] ?? '')));
    const server = String(seen[0]!.server ?? '').slice(0, 80) || undefined;
    let cdn: CDN = null;
    for (const h of seen) {
      const d = detectCDN(h);
      if (d && (cdn === null || cdn === 'other')) cdn = d;
    }
    return { hsts, ...(server ? { server } : {}), cdn };
  });
}

export type ProbeOptions = {
  sector?: Sector;
  org?: string;
  shelfLifeYears?: number;
  budgetMs?: number;
  connect?: Connector;
  headFn?: typeof head;
  now?: () => number;
};

/** Runs P1–P5 + H1 against a validated IP within the time budget and grades the host. */
export async function scanHost(host: string, ip: string, o: ProbeOptions = {}): Promise<SiteResult> {
  const connect = o.connect ?? ((opts) => tls.connect(opts));
  const now = o.now ?? Date.now;
  const deadline = now() + (o.budgetMs ?? 13_000);
  const left = () => Math.max(0, Math.min(5_000, deadline - now()));
  const run = async (extra: ConnectionOptions): Promise<Outcome> => {
    const t = left();
    if (t < 250) return { ok: false, code: 'TIMEOUT', error: 'time budget exhausted', chain: [] };
    return probe(ip, host, extra, t, connect);
  };
  const sector = o.sector ?? 'other';
  const base: SiteResult = {
    host,
    org: o.org ?? host,
    sector,
    verified: false,
    shelfLifeYears: shelfLife(sector, o.shelfLifeYears),
    reachable: false,
    grade: null,
    hygieneFlags: [],
    hndlRisk: 0,
  };

  const p1 = await run({ ecdhCurve: GROUPS_DEFAULT, ALPNProtocols: ['h2', 'http/1.1'] });
  if (!p1.ok && p1.code !== 'TLS_FAIL') return { ...base, error: { code: (p1.code as 'TIMEOUT' | 'REFUSED') ?? 'TLS_FAIL', detail: p1.error ?? '' } };
  const p2 = await run({ minVersion: 'TLSv1.3', ecdhCurve: 'X25519MLKEM768' });
  const p3 = await run({ minVersion: 'TLSv1.3', ecdhCurve: 'SecP256r1MLKEM768:SecP384r1MLKEM1024' });
  const p4 = await run({ minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3', ecdhCurve: GROUPS_DEFAULT });
  // P5 deliberately offers only TLS 1.0/1.1 to detect servers that still accept them.
  // quantumbom:ignore — measurement probe, not a production TLS setting
  const p5 = await run({ minVersion: 'TLSv1', maxVersion: 'TLSv1.1', ciphers: 'DEFAULT@SECLEVEL=0' });
  // P3 offered both alternative hybrids; when it succeeded, find out which one.
  const p3b = p3.ok ? await run({ minVersion: 'TLSv1.3', ecdhCurve: 'SecP384r1MLKEM1024' }) : p3;
  const main = p1.ok ? p1 : p4.ok ? p4 : p5;
  const probes = {
    default: { ok: p1.ok, ...(p1.ok ? { detail: `${VERSION[p1.version ?? ''] ?? p1.version} ${p1.group ?? ''}`.trim() } : { detail: p1.code }) },
    pqOnly: { ok: p2.ok, ...(p2.ok ? {} : { detail: p2.code }) },
    pqAlt: { ok: p3.ok, ...(p3.ok ? {} : { detail: p3.code }) },
    tls13: { ok: p4.ok, ...(p4.ok ? {} : { detail: p4.code }) },
    legacy: { ok: p5.ok, ...(p5.ok ? { detail: VERSION[p5.version ?? ''] } : { detail: p5.code }) },
    head: { ok: false } as { ok: boolean; detail?: string },
  };
  if (!main.ok) return { ...base, probes, error: { code: 'TLS_FAIL', detail: p1.error ?? 'handshake failed' } };

  const maxVersion = VERSION[main.version ?? ''] ?? 'TLS1.2';
  // Node cannot name hybrid groups via getEphemeralKeyInfo(); in TLS 1.3 with only
  // X25519MLKEM768 offered as a PQ group, an unnamed group means the hybrid was used.
  const defaultGroup = main.group ? (GROUP_NAMES[main.group] ?? main.group) : maxVersion === 'TLS1.3' && p2.ok ? 'X25519MLKEM768' : 'unknown';
  const defaultPQ = defaultGroup === 'X25519MLKEM768';
  const http = left() > 500 ? await (o.headFn ?? head)(ip, host, Math.min(5_000, left())) : undefined;
  probes.head = http ? { ok: true } : { ok: false, detail: 'TIMEOUT' };
  const cert = certInfo(main);
  const grade: Grade | null = computeGrade({
    reachable: true,
    certValid: Boolean(cert?.valid),
    maxVersion,
    defaultPQ,
    pqOnly: p2.ok,
    pqAlt: p3.ok,
    tls13: p4.ok || maxVersion === 'TLS1.3',
    legacyTLS: p5.ok,
  });

  const flags: HygieneFlag[] = [];
  if (cert) {
    if (cert.keyAlgorithm === 'RSA' && cert.keySize < 2048) flags.push('RSA_LT_2048');
    if ([cert.signatureAlgorithm, ...cert.chainSignatureAlgorithms.slice(0, -1)].some((s) => /sha1|md5/i.test(s))) flags.push('SHA1_IN_CHAIN');
    if (new Date(cert.notAfter).getTime() - now() < 14 * 86_400_000) flags.push('CERT_EXPIRING_SOON');
    if (!cert.valid) flags.push('CERT_INVALID');
  }
  if (http && !http.hsts) flags.push('NO_HSTS');
  if (p5.ok) flags.push('LEGACY_TLS');
  flags.sort();

  return {
    ...base,
    reachable: true,
    tls: {
      maxVersion,
      defaultGroup,
      pqHybrid: { x25519mlkem768: p2.ok, secp256r1mlkem768: p3.ok && !p3b.ok ? true : p3.ok && p3b.ok ? undefined : false, secp384r1mlkem1024: p3b.ok },
      legacyEnabled: p5.ok,
      cipherSuite: main.cipher ?? 'unknown',
      ...(main.alpn ? { alpn: main.alpn } : {}),
    },
    cert,
    http,
    probes,
    grade,
    hygieneFlags: flags,
    hndlRisk: hndlRisk(grade, sector, base.shelfLifeYears),
  };
}
