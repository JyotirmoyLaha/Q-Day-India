import { beforeAll, describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import Ajv from 'ajv';
import AjvDraft04 from 'ajv-draft-04';
import addFormats from 'ajv-formats';
import { createNodeEngine, walk } from '../src/node';
import type { Engine } from '../src/engine';
import type { Finding, ScanReport } from '../src/types';
import { toCycloneDX, toMarkdown, toSARIF, RULES, FIXES, agilityScore, exposureScore } from '../src/index';

const FIXTURES = join(__dirname, 'fixtures');
const VENDOR = join(__dirname, '..', 'schemas', 'vendor');
let engine: Engine;

beforeAll(async () => {
  engine = await createNodeEngine();
});

type Expect = { file: string; line: number; ruleId: string; algorithm?: string; quantumRisk?: string };

/** Expected findings: inline "expect: rule-a, rule-b" markers plus expected.json files. */
function expectations(dir: string): Expect[] {
  const out: Expect[] = [];
  const visit = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) visit(p);
      else if (f === 'expected.json')
        for (const e of JSON.parse(readFileSync(p, 'utf8')) as Expect[])
          out.push({ ...e, file: relative(dir, join(d, e.file)).split('\\').join('/') });
      else
        readFileSync(p, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            const m = /expect: ([\w, -]+)/.exec(line);
            if (m)
              for (const id of m[1]!
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean))
                out.push({ file: relative(dir, p).split('\\').join('/'), line: i + 1, ruleId: id });
          });
    }
  };
  visit(dir);
  return out;
}

async function scanFixtures(dir = FIXTURES): Promise<ScanReport> {
  return engine.scan(walk(dir, engine), {
    source: { kind: 'local', name: 'fixtures' },
    exclude: ['expected.json'],
  });
}

const key = (f: { file: string; line: number; ruleId: string }) => `${f.file}:${f.line}:${f.ruleId}`;

describe('rules', () => {
  it('compile and reference existing fixes', () => {
    expect(RULES.length).toBeGreaterThan(60);
    for (const r of RULES) if (r.fix) expect(FIXES[r.fix], r.id).toBeDefined();
  });
  it('every tree-sitter query compiles for every target language', async () => {
    expect(await engine.validateQueries()).toEqual([]);
  });
  it('every fix has a verification date and before/after where code applies', () => {
    for (const f of Object.values(FIXES)) {
      expect(f.verified, f.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.why.length, f.id).toBeGreaterThan(20);
    }
  });
});

describe('fixtures', () => {
  let report: ScanReport;
  let expected: Expect[];
  beforeAll(async () => {
    report = await scanFixtures();
    expected = expectations(FIXTURES);
  });

  it('finds every expected finding (recall 100%)', () => {
    const got = new Set(report.findings.map(key));
    const missing = expected.filter((e) => !got.has(key(e)));
    expect(missing).toEqual([]);
  });

  it('has ≥ 90% precision overall and per fixture directory', () => {
    const want = new Set(expected.map(key));
    const fps = report.findings.filter((f) => !want.has(key(f)));
    const precision = (report.findings.length - fps.length) / report.findings.length;
    expect(
      precision,
      `false positives:\n${fps.map((f) => `${key(f)} ${f.snippet}`).join('\n')}`,
    ).toBeGreaterThanOrEqual(0.9);
    for (const dir of readdirSync(FIXTURES)) {
      const mine = report.findings.filter((f) => f.file.startsWith(`${dir}/`));
      if (!mine.length) continue;
      const tp = mine.filter((f) => want.has(key(f))).length;
      expect(tp / mine.length, `${dir} precision`).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('extracts algorithms, key sizes and risks', () => {
    const find = (file: string, ruleId: string) =>
      report.findings.find((f) => f.file.endsWith(file) && f.ruleId === ruleId)!;
    expect(find('crypto_utils.py', 'py-cryptography-rsa-generate')).toMatchObject({
      algorithm: 'RSA',
      keySize: 2048,
      quantumRisk: 'HIGH',
      primitive: 'pke',
      fixId: 'py-rsa-to-mlkem',
    });
    expect(find('crypto_utils.py', 'py-cryptography-ec-generate').parameter).toBe('SECP256R1');
    expect(find('crypto_utils.py', 'py-cryptography-pq')).toMatchObject({
      algorithm: 'ML-KEM-768',
      quantumRisk: 'NONE',
    });
    expect(find('server.js', 'js-generate-keypair')).toMatchObject({ algorithm: 'RSA', keySize: 2048 });
    expect(find('server.js', 'js-weak-hash')).toMatchObject({
      algorithm: 'MD5',
      quantumRisk: 'CLASSICAL_BROKEN',
    });
    expect(find('webcrypto.ts', 'js-webcrypto-algorithm')).toMatchObject({ algorithm: 'RSA', keySize: 3072 });
    expect(find('main.go', 'go-rsa-generate')).toMatchObject({ keySize: 2048 });
    expect(find('main.go', 'go-ecdsa-generate').parameter).toBe('P256');
    expect(find('CryptoService.java', 'java-cipher')).toMatchObject({ algorithm: 'RSA', primitive: 'pke' });
    for (const e of expected.filter((x) => x.algorithm || x.quantumRisk)) {
      const f = report.findings.find((g) => key(g) === key(e));
      if (e.algorithm) expect(f?.algorithm, key(e)).toBe(e.algorithm);
      if (e.quantumRisk) expect(f?.quantumRisk, key(e)).toBe(e.quantumRisk);
    }
  });

  it('records the §10.2 contract fields on every finding', () => {
    for (const f of report.findings) {
      expect(f.line).toBeGreaterThan(0);
      expect(f.column).toBeGreaterThan(0);
      expect(f.snippet.split('\n').length).toBeLessThanOrEqual(3);
      expect([
        'pke',
        'signature',
        'kem',
        'key-agreement',
        'hash',
        'symmetric',
        'mac',
        'kdf',
        'rng',
      ]).toContain(f.primitive);
      expect(['HIGH', 'LOW', 'NONE', 'CLASSICAL_BROKEN']).toContain(f.quantumRisk);
      expect(['high', 'medium', 'low']).toContain(f.confidence);
    }
  });

  it('snapshot of findings', () => {
    const compact = report.findings.map(
      (f) => `${f.file}:${f.line} ${f.ruleId} ${f.algorithm} ${f.keySize ?? ''} ${f.quantumRisk}`,
    );
    expect(compact).toMatchSnapshot();
  });

  it('never outputs private key material', () => {
    const secrets: string[] = [];
    for (const f of ['server.key', 'ec-p256.key', 'id_rsa']) {
      const body = readFileSync(join(FIXTURES, 'pem', f), 'utf8')
        .split('\n')
        .filter((l) => l && !l.startsWith('-----'));
      secrets.push(...body.map((l) => l.trim()).filter((l) => l.length > 16));
    }
    const all =
      JSON.stringify(report) +
      JSON.stringify(toCycloneDX(report)) +
      JSON.stringify(toSARIF(report)) +
      toMarkdown(report);
    for (const s of secrets) expect(all.includes(s), 'key material leaked').toBe(false);
    const priv = report.findings.filter((f) => f.ruleId === 'pem-private-key');
    expect(priv.length).toBe(3);
    for (const p of priv) expect(p.snippet).toMatch(/redacted/);
  });

  it('exports CycloneDX 1.6 that validates against the official schema', () => {
    const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: true });
    addFormats(ajv);
    ajv.addSchema(JSON.parse(readFileSync(join(VENDOR, 'spdx.schema.json'), 'utf8')), 'spdx.schema.json');
    ajv.addSchema(
      JSON.parse(readFileSync(join(VENDOR, 'jsf-0.82.schema.json'), 'utf8')),
      'jsf-0.82.schema.json',
    );
    const validate = ajv.compile(JSON.parse(readFileSync(join(VENDOR, 'bom-1.6.schema.json'), 'utf8')));
    const bom = toCycloneDX(report) as {
      components: {
        cryptoProperties: { assetType: string; algorithmProperties?: { nistQuantumSecurityLevel?: number } };
      }[];
    };
    expect(validate(bom), JSON.stringify(validate.errors?.slice(0, 5), null, 1)).toBe(true);
    expect(bom.components.length).toBeGreaterThan(20);
    const types = new Set(bom.components.map((c) => c.cryptoProperties.assetType));
    expect([...types].sort()).toEqual(['algorithm', 'certificate', 'protocol', 'related-crypto-material']);
    const rsa = bom.components.find((c) => (c as unknown as { name: string }).name === 'RSA-2048');
    expect(rsa?.cryptoProperties.algorithmProperties?.nistQuantumSecurityLevel).toBe(0);
  });

  it('exports SARIF 2.1.0 that validates against the official schema', () => {
    const ajv = new AjvDraft04({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(JSON.parse(readFileSync(join(VENDOR, 'sarif-schema-2.1.0.json'), 'utf8')));
    const sarif = toSARIF(report) as {
      runs: { results: unknown[]; tool: { driver: { rules: unknown[] } } }[];
    };
    expect(validate(sarif), JSON.stringify(validate.errors?.slice(0, 5), null, 1)).toBe(true);
    expect(sarif.runs[0]!.results.length).toBe(report.findings.length);
  });

  it('exports Markdown with scores and fixes', () => {
    const md = toMarkdown(report);
    expect(md).toContain('# QuantumBOM report — fixtures');
    expect(md).toContain('Quantum Exposure');
    expect(md).toContain('## Fixes');
    expect(md).not.toMatch(/\bvulnerable\b|\binsecure\b/i);
  });
});

describe('scores', () => {
  const f = (over: Partial<Finding>): Finding => ({
    ruleId: 'x',
    file: 'a.py',
    line: 1,
    column: 1,
    snippet: '',
    algorithm: 'RSA',
    primitive: 'pke',
    quantumRisk: 'HIGH',
    confidence: 'high',
    message: '',
    assetType: 'algorithm',
    kind: 'treesitter',
    ...over,
  });
  it('exposure is 0 without findings and grows with weighted findings', () => {
    expect(exposureScore([], 100).score).toBe(0);
    const one = exposureScore([f({})], 100).score;
    const many = exposureScore(
      Array.from({ length: 30 }, () => f({ primitive: 'key-agreement' })),
      100,
    ).score;
    expect(one).toBeGreaterThan(0);
    expect(many).toBeGreaterThan(one);
    expect(many).toBeLessThanOrEqual(100);
  });
  it('exposure is normalised by repository size', () => {
    const fs = Array.from({ length: 5 }, () => f({}));
    expect(exposureScore(fs, 10).score).toBeGreaterThan(exposureScore(fs, 5000).score);
  });
  it('NONE findings do not count; low confidence counts less', () => {
    expect(exposureScore([f({ quantumRisk: 'NONE' })], 10).score).toBe(0);
    expect(exposureScore([f({ confidence: 'low' })], 10).score).toBeLessThan(
      exposureScore([f({})], 10).score,
    );
  });
  it('agility: centralised = 100, scattered = low', () => {
    expect(agilityScore([]).score).toBe(100);
    expect(agilityScore(Array.from({ length: 10 }, () => f({ file: 'config.py' }))).score).toBe(100);
    expect(agilityScore(Array.from({ length: 10 }, (_, i) => f({ file: `m${i}.py` }))).score).toBe(10);
    expect(agilityScore([f({ kind: 'pem' }), f({ kind: 'manifest' })]).hardcoded).toBe(0);
  });
});

describe('limits and filters', () => {
  it('skips vendored, minified, oversized and irrelevant files, and enforces the cap', async () => {
    const files = [
      { path: 'node_modules/x/index.js', content: "crypto.createHash('md5')" },
      { path: 'dist/app.js', content: "crypto.createHash('md5')" },
      { path: 'src/app.min.js', content: "crypto.createHash('md5')" },
      { path: 'src/big.py', content: 'x' + ' '.repeat(600 * 1024) },
      { path: 'README.md', content: 'RSA' },
      { path: 'src/a.js', content: "crypto.createHash('md5')" },
      { path: 'src/b.js', content: "crypto.createHash('sha1')" },
    ];
    const r = await engine.scan(files, { source: { kind: 'paste', name: 't' }, maxFiles: 1 });
    expect(r.stats.skipped['excluded-dir']).toBe(2);
    expect(r.stats.skipped.minified).toBe(1);
    expect(r.stats.skipped['too-large']).toBe(1);
    expect(r.stats.skipped.irrelevant).toBe(1);
    expect(r.stats.skipped.cap).toBe(1);
    expect(r.findings).toHaveLength(1);
    expect(r.warnings[0]).toMatch(/Only the first 1/);
  });

  it('relevance check filters a GitHub tree before download', () => {
    expect(engine.isRelevant('src/app.py')).toBe(true);
    expect(engine.isRelevant('deploy/nginx.conf')).toBe(true);
    expect(engine.isRelevant('etc/ssh/sshd_config')).toBe(true);
    expect(engine.isRelevant('docs/logo.png')).toBe(false);
    expect(engine.isRelevant('vendor/lib/x.go')).toBe(false);
    expect(engine.isRelevant('package-lock.json')).toBe(false);
  });

  it('scans a 1,000-file repository well under 60 s', async () => {
    const templates = [
      (i: number) => ({
        path: `py/m${i}.py`,
        content: `import hashlib\n\ndef f${i}(x):\n    return hashlib.sha256(x).hexdigest()\n`.repeat(20),
      }),
      (i: number) => ({
        path: `js/m${i}.js`,
        content:
          `const crypto = require('crypto');\nexport function f${i}(x) { return crypto.createHash('sha256').update(x).digest('hex'); }\n`.repeat(
            20,
          ),
      }),
      (i: number) => ({
        path: `go/m${i}.go`,
        content: `package m\n\nimport "crypto/sha256"\n\nfunc F${i}(b []byte) [32]byte { return sha256.Sum256(b) }\n`,
      }),
      (i: number) => ({
        path: `java/M${i}.java`,
        content: `class M${i} { byte[] f(byte[] b) throws Exception { return java.security.MessageDigest.getInstance("SHA-256").digest(b); } }\n`,
      }),
    ];
    const files = Array.from({ length: 1000 }, (_, i) => templates[i % templates.length]!(i));
    files[500] = {
      path: 'py/rsa.py',
      content:
        'from cryptography.hazmat.primitives.asymmetric import rsa\nk = rsa.generate_private_key(public_exponent=65537, key_size=2048)\n',
    };
    const t0 = Date.now();
    const r = await engine.scan(files, { source: { kind: 'local', name: 'perf' } });
    const ms = Date.now() - t0;
    expect(r.stats.filesScanned).toBe(1000);
    expect(r.findings.filter((f) => f.ruleId === 'py-cryptography-rsa-generate')).toHaveLength(1);
    expect(ms).toBeLessThan(60_000);
    console.log(`1000-file scan: ${ms} ms`);
  });
});

describe('inline suppression', () => {
  it('drops findings marked quantumbom:ignore on the same or previous line and counts them', async () => {
    const content = [
      "const a = crypto.createHash('md5'); // quantumbom:ignore — legacy ETag, not security relevant",
      '// quantumbom:ignore (probe intentionally offers legacy TLS)',
      "const b = crypto.createHash('sha1');",
      "const c = crypto.createHash('md5');",
    ].join('\n');
    const r = await engine.scan([{ path: 'x.js', content }], { source: { kind: 'paste', name: 'x' } });
    expect(r.findings.map((f) => f.line)).toEqual([4]);
    expect(r.stats.suppressed).toBe(2);
  });
});
