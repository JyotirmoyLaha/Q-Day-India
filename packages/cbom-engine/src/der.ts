// Minimal ASN.1 DER reader for keys and X.509 certificates. It extracts only
// algorithm identifiers, key sizes, names and dates; it never returns key bytes.

export type Node = { tag: number; start: number; hdr: number; len: number; bytes: Uint8Array };

function readNode(b: Uint8Array, pos: number): Node {
  const tag = b[pos]!;
  let len = b[pos + 1]!;
  let hdr = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || n > 4) throw new Error('unsupported DER length');
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + b[pos + 2 + i]!;
    hdr += n;
  }
  if (pos + hdr + len > b.length) throw new Error('truncated DER');
  return { tag, start: pos, hdr, len, bytes: b };
}

export const content = (n: Node) => n.bytes.subarray(n.start + n.hdr, n.start + n.hdr + n.len);

export function children(n: Node): Node[] {
  const out: Node[] = [];
  const c = content(n);
  let p = 0;
  while (p < c.length) {
    const child = readNode(c, p);
    out.push(child);
    p += child.hdr + child.len;
  }
  return out;
}

export const parse = (b: Uint8Array) => readNode(b, 0);

export function oid(n: Node): string {
  const c = content(n);
  const parts: number[] = [Math.floor(c[0]! / 40), c[0]! % 40];
  let v = 0;
  for (let i = 1; i < c.length; i++) {
    v = v * 128 + (c[i]! & 0x7f);
    if (!(c[i]! & 0x80)) {
      parts.push(v);
      v = 0;
    }
  }
  return parts.join('.');
}

/** Bit length of a DER INTEGER (ignoring the sign-padding zero byte). */
export function intBits(n: Node): number {
  const c = content(n);
  let i = 0;
  while (i < c.length - 1 && c[i] === 0) i++;
  const first = c[i]!;
  return (c.length - i - 1) * 8 + (first ? 32 - Math.clz32(first) : 0);
}

export const OIDS: Record<string, string> = {
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.113549.1.1.10': 'RSA-PSS',
  '1.2.840.10045.2.1': 'EC',
  '1.2.840.10040.4.1': 'DSA',
  '1.2.840.113549.1.3.1': 'DH',
  '1.3.101.110': 'X25519',
  '1.3.101.111': 'X448',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
  // ML-KEM / ML-DSA / SLH-DSA (NIST CSOR)
  '2.16.840.1.101.3.4.4.1': 'ML-KEM-512',
  '2.16.840.1.101.3.4.4.2': 'ML-KEM-768',
  '2.16.840.1.101.3.4.4.3': 'ML-KEM-1024',
  '2.16.840.1.101.3.4.3.17': 'ML-DSA-44',
  '2.16.840.1.101.3.4.3.18': 'ML-DSA-65',
  '2.16.840.1.101.3.4.3.19': 'ML-DSA-87',
};

export const CURVES: Record<string, { name: string; bits: number }> = {
  '1.2.840.10045.3.1.7': { name: 'P-256', bits: 256 },
  '1.3.132.0.34': { name: 'P-384', bits: 384 },
  '1.3.132.0.35': { name: 'P-521', bits: 521 },
  '1.3.132.0.10': { name: 'secp256k1', bits: 256 },
  '1.2.840.10045.3.1.1': { name: 'P-192', bits: 192 },
  '1.3.132.0.33': { name: 'P-224', bits: 224 },
};

export const SIG_OIDS: Record<string, string> = {
  '1.2.840.113549.1.1.4': 'md5WithRSAEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.10045.4.1': 'ecdsa-with-SHA1',
  '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
  '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
  '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
  '1.2.840.10040.4.3': 'dsa-with-SHA1',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
  '2.16.840.1.101.3.4.3.17': 'ML-DSA-44',
  '2.16.840.1.101.3.4.3.18': 'ML-DSA-65',
  '2.16.840.1.101.3.4.3.19': 'ML-DSA-87',
};

export type KeyInfo = { algorithm: string; bits?: number; curve?: string };

/** SubjectPublicKeyInfo ::= SEQUENCE { algorithm AlgorithmIdentifier, subjectPublicKey BIT STRING } */
export function spkiInfo(spki: Node): KeyInfo {
  const [algId, bitStr] = children(spki);
  const [algOid, params] = children(algId!);
  const algorithm = OIDS[oid(algOid!)] ?? `OID ${oid(algOid!)}`;
  if (algorithm === 'RSA' || algorithm === 'RSA-PSS') {
    // BIT STRING content: 1 unused-bits byte, then RSAPublicKey SEQUENCE { n, e }
    const inner = parse(content(bitStr!).subarray(1));
    return { algorithm, bits: intBits(children(inner)[0]!) };
  }
  if (algorithm === 'EC' && params && params.tag === 0x06) {
    const c = CURVES[oid(params)];
    return { algorithm: 'EC', bits: c?.bits, curve: c?.name ?? oid(params) };
  }
  if (algorithm === 'DSA' && params) {
    return { algorithm, bits: intBits(children(params)[0]!) };
  }
  if (algorithm === 'Ed25519' || algorithm === 'X25519') return { algorithm, bits: 256 };
  if (algorithm === 'Ed448' || algorithm === 'X448') return { algorithm, bits: 448 };
  return { algorithm };
}

/** PKCS#8 PrivateKeyInfo ::= SEQUENCE { version, AlgorithmIdentifier, OCTET STRING privateKey } */
export function pkcs8Info(der: Uint8Array): KeyInfo {
  const [, algId, priv] = children(parse(der));
  const [algOid, params] = children(algId!);
  const algorithm = OIDS[oid(algOid!)] ?? `OID ${oid(algOid!)}`;
  if (algorithm === 'RSA' || algorithm === 'RSA-PSS') return { algorithm, bits: pkcs1Bits(content(priv!)) };
  if (algorithm === 'EC' && params?.tag === 0x06) {
    const c = CURVES[oid(params)];
    return { algorithm, bits: c?.bits, curve: c?.name };
  }
  if (algorithm === 'DSA' && params) return { algorithm, bits: intBits(children(params)[0]!) };
  if (algorithm === 'Ed25519' || algorithm === 'X25519') return { algorithm, bits: 256 };
  return { algorithm };
}

/** RSAPrivateKey ::= SEQUENCE { version, modulus, ... } */
export function pkcs1Bits(der: Uint8Array): number {
  return intBits(children(parse(der))[1]!);
}

/** RSAPublicKey ::= SEQUENCE { modulus, publicExponent } */
export function pkcs1PublicBits(der: Uint8Array): number {
  return intBits(children(parse(der))[0]!);
}

/** ECPrivateKey ::= SEQUENCE { version, privateKey, [0] parameters, [1] publicKey } */
export function sec1Info(der: Uint8Array): KeyInfo {
  const params = children(parse(der)).find((n) => n.tag === 0xa0);
  if (params) {
    const c = CURVES[oid(children(params)[0]!)];
    if (c) return { algorithm: 'EC', bits: c.bits, curve: c.name };
  }
  return { algorithm: 'EC' };
}

function nameString(n: Node): string {
  const short: Record<string, string> = { '2.5.4.3': 'CN', '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST' };
  const parts: string[] = [];
  for (const rdn of children(n))
    for (const atv of children(rdn)) {
      const [t, v] = children(atv);
      const k = short[oid(t!)];
      if (k) parts.push(`${k}=${new TextDecoder().decode(content(v!))}`);
    }
  return parts.join(', ');
}

function time(n: Node): string {
  const s = new TextDecoder().decode(content(n));
  // UTCTime YYMMDDHHMMSSZ or GeneralizedTime YYYYMMDDHHMMSSZ
  const full = n.tag === 0x17 ? (Number(s.slice(0, 2)) >= 50 ? '19' : '20') + s : s;
  return `${full.slice(0, 4)}-${full.slice(4, 6)}-${full.slice(6, 8)}T${full.slice(8, 10)}:${full.slice(10, 12)}:${full.slice(12, 14)}Z`;
}

export type CertInfo = KeyInfo & {
  signatureAlgorithm: string;
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
};

/** Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signature } */
export function certInfo(der: Uint8Array): CertInfo {
  const [tbs, sigAlg] = children(parse(der));
  const t = children(tbs!);
  const off = t[0]!.tag === 0xa0 ? 1 : 0; // optional [0] version
  const issuer = t[2 + off]!;
  const validity = children(t[3 + off]!);
  const subject = t[4 + off]!;
  const spki = t[5 + off]!;
  const sigOid = oid(children(sigAlg!)[0]!);
  return {
    ...spkiInfo(spki),
    signatureAlgorithm: SIG_OIDS[sigOid] ?? `OID ${sigOid}`,
    issuer: nameString(issuer),
    subject: nameString(subject),
    notBefore: time(validity[0]!),
    notAfter: time(validity[1]!),
  };
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Parses the public part of an OpenSSH key blob ("ssh-rsa AAAA..."). */
export function sshPublicKeyInfo(blob: Uint8Array): KeyInfo {
  const dv = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  let p = 0;
  const next = () => {
    const len = dv.getUint32(p);
    const v = blob.subarray(p + 4, p + 4 + len);
    p += 4 + len;
    return v;
  };
  const type = new TextDecoder().decode(next());
  if (type === 'ssh-rsa') {
    next(); // e
    const n = next();
    let i = 0;
    while (i < n.length - 1 && n[i] === 0) i++;
    return { algorithm: 'RSA', bits: (n.length - i - 1) * 8 + (32 - Math.clz32(n[i]!)) };
  }
  if (type === 'ssh-dss') {
    const pr = next();
    let i = 0;
    while (i < pr.length - 1 && pr[i] === 0) i++;
    return { algorithm: 'DSA', bits: (pr.length - i) * 8 };
  }
  if (type.startsWith('ecdsa-sha2-nistp')) {
    const bits = Number(type.slice('ecdsa-sha2-nistp'.length));
    return { algorithm: 'EC', bits, curve: `P-${bits}` };
  }
  if (type === 'ssh-ed25519' || type === 'sk-ssh-ed25519@openssh.com') return { algorithm: 'Ed25519', bits: 256 };
  if (type === 'sk-ecdsa-sha2-nistp256@openssh.com') return { algorithm: 'EC', bits: 256, curve: 'P-256' };
  return { algorithm: type };
}

/** "openssh-key-v1" private key container: read the (unencrypted) public key section only. */
export function opensshPrivateKeyInfo(der: Uint8Array): KeyInfo & { encrypted: boolean } {
  const magic = 'openssh-key-v1\0';
  const dv = new DataView(der.buffer, der.byteOffset, der.byteLength);
  let p = magic.length;
  const next = () => {
    const len = dv.getUint32(p);
    const v = der.subarray(p + 4, p + 4 + len);
    p += 4 + len;
    return v;
  };
  const cipher = new TextDecoder().decode(next());
  next(); // kdfname
  next(); // kdfoptions
  p += 4; // number of keys
  const pub = next();
  return { ...sshPublicKeyInfo(pub), encrypted: cipher !== 'none' };
}
