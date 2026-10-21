// Key material: PEM blocks (certificates, public and private keys) and OpenSSH
// keys. Reports algorithm and size only. Snippets are replaced with a
// redacted marker so no key material can ever reach a report.
import type { Finding, QuantumRisk } from '../types';
import {
  base64ToBytes,
  certInfo,
  opensshPrivateKeyInfo,
  pkcs1Bits,
  pkcs1PublicBits,
  pkcs8Info,
  sec1Info,
  spkiInfo,
  parse,
  sshPublicKeyInfo,
  type KeyInfo,
} from '../der';

const PEM_RE = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;
const SSH_PUB_RE = /(?:^|\s)(ssh-rsa|ssh-dss|ssh-ed25519|ecdsa-sha2-nistp(?:256|384|521)|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com) (AAAA[A-Za-z0-9+/=]+)/g;

const PQ = /^(ML-KEM|ML-DSA|SLH-DSA)/;

function label(k: KeyInfo): string {
  if (k.algorithm === 'EC') return k.curve ? `ECC ${k.curve}` : 'ECC';
  return k.bits && /^(RSA|DSA|DH)/.test(k.algorithm) ? `${k.algorithm}-${k.bits}` : k.algorithm;
}

function risk(k: KeyInfo): QuantumRisk {
  if (PQ.test(k.algorithm)) return 'NONE';
  if ((k.algorithm === 'RSA' || k.algorithm === 'DSA') && k.bits && k.bits < 2048) return 'CLASSICAL_BROKEN';
  if (k.algorithm === 'DSA') return 'CLASSICAL_BROKEN';
  return 'HIGH';
}

const primitiveOf = (k: KeyInfo) =>
  /X25519|X448|DH/.test(k.algorithm) ? ('key-agreement' as const) : PQ.test(k.algorithm) && k.algorithm.startsWith('ML-KEM') ? ('kem' as const) : k.algorithm === 'RSA' ? ('pke' as const) : ('signature' as const);

const lineAt = (text: string, offset: number) => text.slice(0, offset).split('\n').length;

export function scanKeyMaterial(file: string, text: string): Finding[] {
  const out: Finding[] = [];
  for (const m of text.matchAll(PEM_RE)) {
    const type = m[1]!;
    const line = lineAt(text, m.index!);
    const body = m[2]!.replace(/^[A-Za-z-]+:.*$/gm, ''); // drop RFC 1421 headers (Proc-Type etc.)
    const encryptedHeader = /Proc-Type:\s*4,ENCRYPTED/.test(m[2]!);
    const base = { file, line, column: 1, kind: 'pem' as const, confidence: 'high' as const };
    try {
      const der = base64ToBytes(body);
      if (type === 'CERTIFICATE' || type === 'TRUSTED CERTIFICATE') {
        const c = certInfo(der);
        const weakSig = /md5|sha1|SHA1/i.test(c.signatureAlgorithm);
        out.push({
          ...base,
          ruleId: 'pem-certificate',
          snippet: `-----BEGIN ${type}----- (${label(c)}, ${c.signatureAlgorithm})`,
          algorithm: label(c),
          keySize: c.bits,
          parameter: c.curve,
          primitive: 'signature',
          quantumRisk: weakSig ? 'CLASSICAL_BROKEN' : risk(c),
          fixId: 'certificate-classical',
          assetType: 'certificate',
          message: `X.509 certificate with a ${label(c)} key, signed with ${c.signatureAlgorithm}${weakSig ? ' (SHA-1/MD5 signatures are already deprecated)' : ''}. Expires ${c.notAfter.slice(0, 10)}.`,
          details: { subject: c.subject, issuer: c.issuer, notBefore: c.notBefore, notAfter: c.notAfter, signatureAlgorithm: c.signatureAlgorithm },
        });
        continue;
      }
      let k: KeyInfo | null = null;
      let isPrivate = false;
      let encrypted = encryptedHeader;
      switch (type) {
        case 'PUBLIC KEY':
          k = spkiInfo(parse(der));
          break;
        case 'RSA PUBLIC KEY':
          k = { algorithm: 'RSA', bits: pkcs1PublicBits(der) };
          break;
        case 'PRIVATE KEY':
          k = pkcs8Info(der);
          isPrivate = true;
          break;
        case 'RSA PRIVATE KEY':
          isPrivate = true;
          k = encrypted ? { algorithm: 'RSA' } : { algorithm: 'RSA', bits: pkcs1Bits(der) };
          break;
        case 'EC PRIVATE KEY':
          isPrivate = true;
          k = encrypted ? { algorithm: 'EC' } : sec1Info(der);
          break;
        case 'DSA PRIVATE KEY':
          isPrivate = true;
          k = { algorithm: 'DSA' };
          break;
        case 'OPENSSH PRIVATE KEY': {
          isPrivate = true;
          const info = opensshPrivateKeyInfo(der);
          encrypted = info.encrypted;
          k = info;
          break;
        }
        case 'ENCRYPTED PRIVATE KEY':
          isPrivate = true;
          encrypted = true;
          k = { algorithm: 'unknown (encrypted)' };
          break;
        case 'CERTIFICATE REQUEST':
          continue;
        default:
          continue;
      }
      if (!k) continue;
      if (isPrivate) {
        out.push({
          ...base,
          ruleId: 'pem-private-key',
          snippet: `-----BEGIN ${type}----- [private key contents redacted]`,
          algorithm: label(k),
          keySize: k.bits,
          parameter: k.curve,
          primitive: primitiveOf(k),
          quantumRisk: k.algorithm.startsWith('unknown') ? 'HIGH' : risk(k),
          fixId: 'private-key-in-repo',
          assetType: 'related-crypto-material',
          message: `Private key file found (${label(k)}${encrypted ? ', passphrase-protected' : ''}) — remove it from the repository and rotate it.`,
          details: { materialType: 'private-key' },
        });
      } else {
        out.push({
          ...base,
          ruleId: 'pem-public-key',
          snippet: `-----BEGIN ${type}----- (${label(k)})`,
          algorithm: label(k),
          keySize: k.bits,
          parameter: k.curve,
          primitive: primitiveOf(k),
          quantumRisk: risk(k),
          fixId: k.algorithm === 'RSA' ? 'rsa-to-mlkem' : 'signatures-to-mldsa',
          assetType: 'related-crypto-material',
          message: `Public key (${label(k)}) — not quantum-safe.`,
          details: { materialType: 'public-key' },
        });
      }
    } catch {
      out.push({
        ...base,
        ruleId: type.includes('PRIVATE') ? 'pem-private-key' : 'pem-unparsed',
        snippet: `-----BEGIN ${type}----- [contents redacted]`,
        algorithm: 'unknown',
        primitive: 'signature',
        quantumRisk: type.includes('PRIVATE') ? 'HIGH' : 'NONE',
        confidence: 'low',
        fixId: type.includes('PRIVATE') ? 'private-key-in-repo' : undefined,
        assetType: 'related-crypto-material',
        message: type.includes('PRIVATE')
          ? 'Private key block found (could not be decoded) — remove it from the repository and rotate it.'
          : `PEM block "${type}" could not be decoded.`,
      });
    }
  }

  for (const m of text.matchAll(SSH_PUB_RE)) {
    const offset = m.index! + m[0].indexOf(m[1]!);
    const line = lineAt(text, offset);
    try {
      const k = sshPublicKeyInfo(base64ToBytes(m[2]!));
      out.push({
        ruleId: 'ssh-public-key',
        file,
        line,
        column: 1,
        kind: 'pem',
        confidence: 'high',
        snippet: `${m[1]} AAAA… (${label(k)})`,
        algorithm: label(k),
        keySize: k.bits,
        parameter: k.curve,
        primitive: 'signature',
        quantumRisk: risk(k),
        fixId: 'ssh-keys',
        assetType: 'related-crypto-material',
        message: `SSH public key (${label(k)}) — SSH signatures are still classical; key exchange can already be post-quantum.`,
        details: { materialType: 'public-key' },
      });
    } catch {
      // not a real key blob
    }
  }
  return out;
}
