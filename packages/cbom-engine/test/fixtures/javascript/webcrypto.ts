// Fixture: WebCrypto + jose in TypeScript.
import { generateKeyPair, SignJWT } from 'jose';
import { KEYUTIL } from 'jsrsasign';

export async function makeKeys(): Promise<CryptoKeyPair> {
  const alg: RsaHashedKeyGenParams = { name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }; // expect: js-webcrypto-algorithm
  await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-384' }, true, ['deriveKey']); // expect: js-webcrypto-algorithm
  await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  return crypto.subtle.generateKey(alg, true, ['encrypt', 'decrypt']);
}

export async function token(payload: Record<string, unknown>) {
  const { privateKey } = await generateKeyPair('ES256'); // expect: js-jose-generate-keypair
  return new SignJWT(payload).setProtectedHeader({ alg: 'ES256' }).sign(privateKey); // expect: js-jsonwebtoken
}

export const legacy = KEYUTIL.generateKeypair('RSA', 2048); // expect: js-jsrsasign
