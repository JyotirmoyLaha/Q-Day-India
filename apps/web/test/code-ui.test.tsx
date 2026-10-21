import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Finding, ScanReport } from '@qday/cbom-engine';
import { computeScores } from '@qday/cbom-engine';
import { CodeResults } from '@/components/code/CodeResults';
import CodePage from '@/app/code/page';
import { expectNoAxeViolations } from './axe';

const f = (over: Partial<Finding>): Finding => ({
  ruleId: 'py-cryptography-rsa-generate',
  file: 'src/keys.py',
  line: 4,
  column: 7,
  snippet: 'key = rsa.generate_private_key(public_exponent=65537, key_size=2048)',
  algorithm: 'RSA',
  keySize: 2048,
  primitive: 'pke',
  quantumRisk: 'HIGH',
  confidence: 'high',
  fixId: 'py-rsa-to-mlkem',
  message: 'RSA key generation (pyca/cryptography) — not quantum-safe.',
  assetType: 'algorithm',
  kind: 'treesitter',
  ...over,
});

const findings = [
  f({}),
  f({
    ruleId: 'py-hashlib-weak',
    line: 9,
    algorithm: 'MD5',
    keySize: undefined,
    primitive: 'hash',
    quantumRisk: 'CLASSICAL_BROKEN',
    fixId: 'hash-md5-sha1',
    message: 'MD5 — collision attacks exist today.',
  }),
  f({
    ruleId: 'js-cipher',
    file: 'web/a.js',
    algorithm: 'AES-128',
    keySize: undefined,
    primitive: 'symmetric',
    quantumRisk: 'LOW',
    fixId: 'symmetric-aes256',
    message: 'AES-128.',
  }),
];
const report: ScanReport = {
  tool: { name: 'QuantumBOM', version: '1.0.0' },
  scannedAt: '2026-10-21T10:00:00Z',
  source: { kind: 'github', name: 'acme/bank', ref: 'main@abc1234' },
  stats: {
    filesSeen: 10,
    filesScanned: 5,
    skipped: {},
    bytesScanned: 1000,
    durationMs: 1200,
    byLanguage: { python: 4 },
    suppressed: 0,
  },
  findings,
  scores: computeScores(findings, 5),
  warnings: [],
};

describe('/code UI', () => {
  it('page renders accessibly with privacy notice', async () => {
    const { container } = render(<CodePage />);
    expect(screen.getByText(/Your code is never uploaded/)).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Public GitHub repo' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Paste code' }));
    expect(screen.getByLabelText('Code')).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('results show gauges, groups, snippets and an expandable fix', async () => {
    const { container } = render(<CodeResults report={report} />);
    expect(screen.getByRole('img', { name: /Quantum Exposure: \d+ out of 100/ })).toBeTruthy();
    expect(screen.getByRole('img', { name: /Crypto-Agility: \d+ out of 100/ })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Not quantum-safe (Shor)' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Already weak today' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Fix: Python: replace RSA/ }));
    expect(screen.getByText(/MLKEM768PrivateKey.generate/)).toBeTruthy();
    expect(screen.getByText(/Last verified 2026-10-21/)).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('risk filter narrows the list', () => {
    render(<CodeResults report={report} />);
    fireEvent.click(screen.getByRole('button', { name: /Grover-affected \(1\)/ }));
    expect(screen.queryByRole('region', { name: 'Not quantum-safe (Shor)' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Grover-affected' })).toBeTruthy();
  });
});
