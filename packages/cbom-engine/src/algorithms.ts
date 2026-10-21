// Algorithm metadata for the CBOM: NIST PQ security levels, classical
// security levels and OIDs. Keys are matched case-insensitively by prefix.
import type { Finding, Primitive } from './types';

type Meta = { nist?: number; classical?: number; oid?: string };

const META: [RegExp, (bits?: number) => Meta][] = [
  [/^ML-KEM-512/i, () => ({ nist: 1, oid: '2.16.840.1.101.3.4.4.1' })],
  [/^ML-KEM-768/i, () => ({ nist: 3, oid: '2.16.840.1.101.3.4.4.2' })],
  [/^ML-KEM-1024/i, () => ({ nist: 5, oid: '2.16.840.1.101.3.4.4.3' })],
  [/^ML-DSA-44/i, () => ({ nist: 2, oid: '2.16.840.1.101.3.4.3.17' })],
  [/^ML-DSA-65/i, () => ({ nist: 3, oid: '2.16.840.1.101.3.4.3.18' })],
  [/^ML-DSA-87/i, () => ({ nist: 5, oid: '2.16.840.1.101.3.4.3.19' })],
  [/^X25519MLKEM768|hybrid/i, () => ({ nist: 3 })],
  [/^RSA/i, (b) => ({ nist: 0, classical: b ? (b >= 15360 ? 256 : b >= 7680 ? 192 : b >= 3072 ? 128 : b >= 2048 ? 112 : 80) : undefined, oid: '1.2.840.113549.1.1.1' })],
  [/^(ECDSA|ECDH|ECC|EC\b|EC$)/i, (b) => ({ nist: 0, classical: b ? Math.floor(b / 2) : undefined, oid: '1.2.840.10045.2.1' })],
  [/^Ed25519/i, () => ({ nist: 0, classical: 128, oid: '1.3.101.112' })],
  [/^Ed448/i, () => ({ nist: 0, classical: 224, oid: '1.3.101.113' })],
  [/^X25519/i, () => ({ nist: 0, classical: 128, oid: '1.3.101.110' })],
  [/^X448/i, () => ({ nist: 0, classical: 224, oid: '1.3.101.111' })],
  [/^(DH|FFDH|Diffie)/i, () => ({ nist: 0, oid: '1.2.840.113549.1.3.1' })],
  [/^DSA/i, () => ({ nist: 0, oid: '1.2.840.10040.4.1' })],
  [/^MD5/i, () => ({ nist: 0, classical: 0, oid: '1.2.840.113549.2.5' })],
  [/^SHA-?1\b/i, () => ({ nist: 0, classical: 0, oid: '1.3.14.3.2.26' })],
  [/^(3DES|TDEA|DESede|Triple)/i, () => ({ nist: 0, classical: 112 })],
  [/^DES/i, () => ({ nist: 0, classical: 56 })],
  [/^RC4/i, () => ({ nist: 0, classical: 0 })],
  [/^AES-?128/i, () => ({ nist: 1, classical: 128 })],
  [/^AES-?192/i, () => ({ nist: 3, classical: 192 })],
  [/^AES-?256/i, () => ({ nist: 5, classical: 256 })],
  [/^SHA-?256|^SHA3-256/i, () => ({ nist: 2, classical: 128 })],
  [/^SHA-?384|^SHA3-384/i, () => ({ nist: 4, classical: 192 })],
  [/^SHA-?512|^SHA3-512/i, () => ({ nist: 5, classical: 256 })],
];

export function algorithmMeta(algorithm: string, bits?: number): Meta {
  for (const [re, f] of META) if (re.test(algorithm)) return f(bits);
  return {};
}

/** Display name of the asset: "RSA-2048", "ECDSA P-256", "SHA-1". */
export function assetName(f: Pick<Finding, 'algorithm' | 'keySize' | 'parameter'>): string {
  let name = f.algorithm;
  if (f.keySize && !/\d{3,}/.test(name) && /^(RSA|DSA|DH|AES)/i.test(name)) name = `${name}-${f.keySize}`;
  if (f.parameter && !name.includes(f.parameter)) name = `${name} ${f.parameter}`;
  return name;
}

export const CDX_PRIMITIVE: Record<Primitive, string> = {
  pke: 'pke',
  signature: 'signature',
  kem: 'kem',
  'key-agreement': 'key-agree',
  hash: 'hash',
  symmetric: 'block-cipher',
  mac: 'mac',
  kdf: 'kdf',
  rng: 'drbg',
};

export const CRYPTO_FUNCTIONS: Record<Primitive, string[]> = {
  pke: ['keygen', 'encrypt', 'decrypt'],
  signature: ['keygen', 'sign', 'verify'],
  kem: ['keygen', 'encapsulate', 'decapsulate'],
  'key-agreement': ['keygen', 'keyderive'],
  hash: ['digest'],
  symmetric: ['encrypt', 'decrypt'],
  mac: ['tag'],
  kdf: ['keyderive'],
  rng: ['generate'],
};
