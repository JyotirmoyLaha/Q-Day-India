// SARIF 2.1.0 exporter so findings appear in GitHub Code Scanning.
import type { Finding, QuantumRisk, ScanReport } from '../types';
import { getFix, RULES } from '../rules';
import { assetName } from '../algorithms';

const LEVEL: Record<QuantumRisk, 'error' | 'warning' | 'note' | 'none'> = {
  HIGH: 'warning',
  CLASSICAL_BROKEN: 'error',
  LOW: 'note',
  NONE: 'none',
};

const SEVERITY: Record<QuantumRisk, string> = {
  HIGH: '6.0',
  CLASSICAL_BROKEN: '7.0',
  LOW: '3.0',
  NONE: '0.0',
};

const RISK_TEXT: Record<QuantumRisk, string> = {
  HIGH: 'not quantum-safe (breakable by Shor’s algorithm on a future quantum computer); migration recommended',
  CLASSICAL_BROKEN: 'already weak against classical attacks; replace now',
  LOW: 'weakened by Grover’s algorithm; a larger key size is recommended',
  NONE: 'informational: no quantum risk',
};

const BUILTIN: Record<string, string> = {
  'pem-certificate': 'X.509 certificate with a classical (RSA/ECDSA) key',
  'pem-private-key': 'Private key committed to the repository',
  'pem-public-key': 'Classical public key file',
  'ssh-public-key': 'Classical SSH public key',
  'pem-unparsed': 'Undecodable PEM block',
};

export function toSARIF(report: ScanReport, uriBase = '%SRCROOT%'): Record<string, unknown> {
  const ids = [...new Set(report.findings.map((f) => f.ruleId))].sort();
  const worst = new Map<string, Finding>();
  for (const f of report.findings) if (!worst.has(f.ruleId)) worst.set(f.ruleId, f);

  const rules = ids.map((id) => {
    const r = RULES.find((x) => x.id === id);
    const sample = worst.get(id)!;
    const fix = getFix(sample.fixId ?? r?.fix);
    const short = r?.message ?? BUILTIN[id] ?? id;
    return {
      id,
      name: id.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase()),
      shortDescription: { text: short.length > 120 ? short.slice(0, 117) + '…' : short },
      fullDescription: { text: short },
      help: {
        text: fix ? `${fix.title}\n\n${fix.why}\n\n${fix.replacement}` : RISK_TEXT[sample.quantumRisk],
        markdown: fix ? fix.markdown : RISK_TEXT[sample.quantumRisk],
      },
      defaultConfiguration: { level: LEVEL[sample.quantumRisk] },
      properties: {
        tags: ['security', 'cryptography', 'post-quantum', sample.primitive],
        'security-severity': SEVERITY[sample.quantumRisk],
        precision: sample.confidence === 'high' ? 'high' : sample.confidence === 'medium' ? 'medium' : 'low',
      },
    };
  });

  const results = report.findings.map((f) => ({
    ruleId: f.ruleId,
    ruleIndex: ids.indexOf(f.ruleId),
    level: LEVEL[f.quantumRisk],
    message: { text: `${assetName(f)} (${f.primitive}): ${f.message} — ${RISK_TEXT[f.quantumRisk]}.` },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: f.file, uriBaseId: uriBase },
          region: { startLine: f.line, startColumn: f.column, snippet: { text: f.snippet } },
        },
      },
    ],
    partialFingerprints: { 'qdayFinding/v1': `${f.ruleId}:${f.file}:${f.snippet.split('\n')[0]!.trim()}` },
    properties: {
      algorithm: f.algorithm,
      quantumRisk: f.quantumRisk,
      confidence: f.confidence,
      ...(f.keySize ? { keySize: f.keySize } : {}),
    },
  }));

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'QuantumBOM',
            fullName: report.tool.name,
            version: report.tool.version,
            semanticVersion: report.tool.version,
            informationUri: 'https://q-day-india.vercel.app/code',
            rules,
          },
        },
        originalUriBaseIds: { [uriBase]: { description: { text: 'Repository root' } } },
        results,
        properties: { quantumExposure: report.scores.exposure, cryptoAgility: report.scores.agility },
      },
    ],
  };
}
