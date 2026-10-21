// CycloneDX 1.6 CBOM exporter (§6.6). Validated against the official schema in tests.
import type { Finding, ScanReport } from '../types';
import { algorithmMeta, assetName, CDX_PRIMITIVE, CRYPTO_FUNCTIONS } from '../algorithms';
import { getFix } from '../rules';

type Component = Record<string, unknown>;

function uuid(seed: string): string {
  // Deterministic v4-shaped UUID from the report contents (stable diffs, no RNG needed).
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + seed.charCodeAt(i), 2246822519) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  const s = hex(h1) + hex(h2) + hex(h1 ^ h2) + hex((h1 * 31 + h2) >>> 0);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-a${s.slice(17, 20)}-${s.slice(20, 32)}`;
}

const RISK_ORDER = { HIGH: 0, CLASSICAL_BROKEN: 1, LOW: 2, NONE: 3 } as const;

function groupKey(f: Finding): string {
  if (f.assetType === 'certificate') return `cert|${f.file}|${f.line}`;
  if (f.assetType === 'related-crypto-material') return `rcm|${f.file}|${f.line}`;
  if (f.assetType === 'protocol') return `proto|${f.algorithm}|${f.parameter ?? ''}`;
  return `alg|${assetName(f)}|${f.primitive}`;
}

export function toCycloneDX(report: ScanReport): Record<string, unknown> {
  const groups = new Map<string, Finding[]>();
  for (const f of report.findings) {
    const k = groupKey(f);
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }

  const components: Component[] = [];
  let i = 0;
  for (const fs of groups.values()) {
    const f = [...fs].sort((a, b) => RISK_ORDER[a.quantumRisk] - RISK_ORDER[b.quantumRisk])[0]!;
    const ref = `crypto-${++i}`;
    const meta = algorithmMeta(f.algorithm, f.keySize);
    let name = assetName(f);
    const crypto: Record<string, unknown> = { assetType: f.assetType };

    if (f.assetType === 'certificate') {
      name = `X.509 certificate (${assetName(f)})${f.details?.subject ? ` ${f.details.subject}` : ''}`;
      crypto.certificateProperties = {
        ...(f.details?.subject ? { subjectName: f.details.subject } : {}),
        ...(f.details?.issuer ? { issuerName: f.details.issuer } : {}),
        ...(f.details?.notBefore ? { notValidBefore: f.details.notBefore } : {}),
        ...(f.details?.notAfter ? { notValidAfter: f.details.notAfter } : {}),
        certificateFormat: 'X.509',
      };
    } else if (f.assetType === 'related-crypto-material') {
      const type =
        f.details?.materialType === 'private-key'
          ? 'private-key'
          : f.details?.materialType === 'public-key'
            ? 'public-key'
            : 'key';
      name = `${assetName(f)} ${type.replace('-', ' ')}`;
      crypto.relatedCryptoMaterialProperties = { type, ...(f.keySize ? { size: f.keySize } : {}) };
    } else if (f.assetType === 'protocol') {
      crypto.protocolProperties = {
        type: /ssh/i.test(f.algorithm) ? 'ssh' : 'tls',
        ...(f.parameter ? { version: f.parameter } : {}),
      };
    } else {
      crypto.algorithmProperties = {
        primitive: /RC4/i.test(f.algorithm) ? 'stream-cipher' : CDX_PRIMITIVE[f.primitive],
        ...(f.keySize
          ? { parameterSetIdentifier: String(f.keySize) }
          : f.parameter
            ? { parameterSetIdentifier: f.parameter }
            : {}),
        ...(f.parameter && /^(P-|secp|prime|curve|brainpool)/i.test(f.parameter)
          ? { curve: f.parameter }
          : {}),
        cryptoFunctions: CRYPTO_FUNCTIONS[f.primitive],
        ...(meta.classical !== undefined ? { classicalSecurityLevel: meta.classical } : {}),
        ...(meta.nist !== undefined ? { nistQuantumSecurityLevel: meta.nist } : {}),
      };
      if (meta.oid) crypto.oid = meta.oid;
    }

    const fix = getFix(f.fixId);
    components.push({
      type: 'cryptographic-asset',
      'bom-ref': ref,
      name,
      description: f.message,
      cryptoProperties: crypto,
      evidence: {
        occurrences: fs.map((o) => ({
          location: o.file,
          line: o.line,
          offset: Math.max(0, o.column - 1),
          additionalContext: `${o.ruleId} (confidence: ${o.confidence})`,
        })),
      },
      properties: [
        { name: 'qday:quantumRisk', value: f.quantumRisk },
        { name: 'qday:confidence', value: f.confidence },
        { name: 'qday:rules', value: [...new Set(fs.map((o) => o.ruleId))].join(',') },
        ...(fix ? [{ name: 'qday:fix', value: `${fix.id}: ${fix.title}` }] : []),
      ],
    });
  }

  return {
    $schema: 'http://cyclonedx.org/schema/bom-1.6.schema.json',
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: `urn:uuid:${uuid(report.scannedAt + report.source.name + report.findings.length)}`,
    version: 1,
    metadata: {
      timestamp: report.scannedAt,
      tools: { components: [{ type: 'application', name: report.tool.name, version: report.tool.version }] },
      component: {
        type: 'application',
        'bom-ref': 'scanned-source',
        name: report.source.name,
        ...(report.source.ref ? { version: report.source.ref } : {}),
      },
      properties: [
        { name: 'qday:quantumExposure', value: String(report.scores.exposure) },
        { name: 'qday:cryptoAgility', value: String(report.scores.agility) },
        { name: 'qday:filesScanned', value: String(report.stats.filesScanned) },
      ],
    },
    components,
  };
}
