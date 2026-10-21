// @vitest-environment node
// The browser pipeline (sources → engine → exporters) exercised under Node with
// a mocked GitHub, plus one live scan behind QDAY_LIVE_TESTS=1.
import { beforeAll, describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createNodeEngine } from '@qday/cbom-engine/node';
import type { Engine } from '@qday/cbom-engine';
import { toCycloneDX } from '@qday/cbom-engine';
import { fetchGitHubFiles, parseGitHubURL, planGitHub, zipFiles, type FetchLike } from '@/lib/sources';
import { decodeReport, encodeReport, MAX_FRAGMENT_CHARS, shareURL } from '@/lib/share';

let engine: Engine;
beforeAll(async () => {
  engine = await createNodeEngine();
});

const FIX = join(__dirname, '../../../packages/cbom-engine/test/fixtures');
const files: Record<string, string> = {
  'src/crypto_utils.py': readFileSync(join(FIX, 'python/crypto_utils.py'), 'utf8'),
  'web/server.js': readFileSync(join(FIX, 'javascript/server.js'), 'utf8'),
  'deploy/nginx.conf': readFileSync(join(FIX, 'config/nginx.conf'), 'utf8'),
  'docs/logo.png': '\u0000PNG',
  'node_modules/x/index.js': "require('crypto').createHash('md5')",
  'README.md': 'RSA',
};

function mockGitHub() {
  const calls: { url: string; auth?: string }[] = [];
  const fetchFn: FetchLike = async (url, init) => {
    const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
    calls.push({ url, auth });
    const u = new URL(url);
    if (u.host === 'api.github.com') {
      if (u.pathname === '/repos/acme/bank') return Response.json({ default_branch: 'main', private: false });
      if (u.pathname === '/repos/acme/bank/commits/main')
        return new Response('abc1234def5678abc1234def5678abc1234def56\n');
      if (u.pathname.startsWith('/repos/acme/bank/git/trees/'))
        return Response.json({
          truncated: false,
          tree: Object.entries(files)
            .map(([path, c]) => ({ path, type: 'blob', size: c.length }))
            .concat([{ path: 'src', type: 'tree', size: 0 }]),
        });
      return new Response('not found', { status: 404 });
    }
    if (u.host === 'raw.githubusercontent.com') {
      const path = decodeURIComponent(u.pathname.split('/').slice(4).join('/'));
      return new Response(files[path] ?? '', { status: files[path] ? 200 : 404 });
    }
    throw new Error(`unexpected host ${u.host}`);
  };
  return { calls, fetchFn };
}

describe('GitHub URL parsing', () => {
  it.each([
    ['https://github.com/acme/bank', { owner: 'acme', repo: 'bank' }],
    ['github.com/acme/bank.git', { owner: 'acme', repo: 'bank' }],
    [
      'https://github.com/acme/bank/tree/dev/services/api',
      { owner: 'acme', repo: 'bank', ref: 'dev', subpath: 'services/api' },
    ],
    ['acme/bank', { owner: 'acme', repo: 'bank' }],
    ['git@github.com:acme/bank.git', { owner: 'acme', repo: 'bank' }],
  ])('%s', (input, want) => expect(parseGitHubURL(input)).toMatchObject(want));
  it('rejects non-GitHub input', () => {
    expect(parseGitHubURL('https://gitlab.com/a/b')).toBeNull();
    expect(parseGitHubURL('not a url')).toBeNull();
  });
});

describe('GitHub source (mocked)', () => {
  it('uses 3 API calls, filters irrelevant files and never sends the token to raw.githubusercontent.com', async () => {
    const { calls, fetchFn } = mockGitHub();
    const plan = await planGitHub({ owner: 'acme', repo: 'bank' }, (p) => engine.isRelevant(p), {
      token: 'ghp_secret',
      fetchFn,
    });
    expect(calls.filter((c) => c.url.startsWith('https://api.github.com'))).toHaveLength(3);
    expect(plan.files.map((f) => f.path).sort()).toEqual([
      'deploy/nginx.conf',
      'src/crypto_utils.py',
      'web/server.js',
    ]);
    const got = [];
    for await (const f of fetchGitHubFiles(plan, { fetchFn })) got.push(f);
    expect(got).toHaveLength(3);
    const raw = calls.filter((c) => c.url.startsWith('https://raw.githubusercontent.com/acme/bank/abc1234'));
    expect(raw).toHaveLength(3);
    expect(raw.every((c) => !c.auth)).toBe(true);
    expect(calls.filter((c) => c.auth).every((c) => c.url.startsWith('https://api.github.com/'))).toBe(true);
    expect(
      calls.every((c) => /^https:\/\/(api\.github\.com|raw\.githubusercontent\.com)\//.test(c.url)),
    ).toBe(true);
  });

  it('end-to-end: plan → download → scan → CBOM', async () => {
    const { fetchFn } = mockGitHub();
    const plan = await planGitHub({ owner: 'acme', repo: 'bank' }, (p) => engine.isRelevant(p), { fetchFn });
    const report = await engine.scan(fetchGitHubFiles(plan, { fetchFn }), {
      source: { kind: 'github', name: 'acme/bank' },
    });
    expect(report.stats.filesScanned).toBe(3);
    expect(report.findings.some((f) => f.ruleId === 'py-cryptography-rsa-generate')).toBe(true);
    expect(report.findings.some((f) => f.ruleId === 'nginx-ecdh-curve')).toBe(true);
    expect((toCycloneDX(report) as { components: unknown[] }).components.length).toBeGreaterThan(5);
  });

  it('reports rate limits and private repos clearly', async () => {
    const limited: FetchLike = async () =>
      new Response('', { status: 403, headers: { 'x-ratelimit-reset': '0' } });
    await expect(planGitHub({ owner: 'a', repo: 'b' }, () => true, { fetchFn: limited })).rejects.toThrow(
      /rate limit/,
    );
    const priv: FetchLike = async () => Response.json({ default_branch: 'main', private: true });
    await expect(planGitHub({ owner: 'a', repo: 'b' }, () => true, { fetchFn: priv })).rejects.toThrow(
      /private/,
    );
  });
});

describe('zip source', () => {
  it('reads a GitHub-style archive in memory and strips the top folder', async () => {
    const zip = new JSZip();
    zip.file('bank-main/src/crypto_utils.py', files['src/crypto_utils.py']!);
    zip.file('bank-main/node_modules/x/index.js', "require('crypto').createHash('md5')");
    zip.file('bank-main/img/logo.png', 'binary');
    const data = await zip.generateAsync({ type: 'arraybuffer' });
    const report = await engine.scan(
      zipFiles(data, (p) => engine.isRelevant(p)),
      { source: { kind: 'zip', name: 'bank-main' } },
    );
    expect(report.stats.filesScanned).toBe(1);
    expect(report.findings[0]!.file).toBe('src/crypto_utils.py');
  });
});

describe('share via URL fragment', () => {
  it('round-trips a report and refuses oversized ones', async () => {
    const report = await engine.scan([{ path: 'a.py', content: files['src/crypto_utils.py']! }], {
      source: { kind: 'paste', name: 'a.py' },
    });
    const back = decodeReport(`#r=${encodeReport(report)}`);
    expect(back?.findings).toEqual(report.findings);
    expect(back?.scores).toEqual(report.scores);
    const url = shareURL(report, 'https://x.in/code?q=1#old');
    expect(url).toMatch(/^https:\/\/x\.in\/code\?q=1#r=/);
    const huge = {
      ...report,
      findings: Array.from({ length: 4000 }, (_, i) => ({
        ...report.findings[0]!,
        line: i,
        snippet: `s${i}${Math.random()}`,
      })),
    };
    expect(encodeReport(huge).length).toBeGreaterThan(MAX_FRAGMENT_CHARS);
    expect(shareURL(huge, 'https://x.in/code')).toBeNull();
    expect(decodeReport('#r=garbage')).toBeNull();
  });
});

describe.runIf(process.env.QDAY_LIVE_TESTS === '1')('live GitHub scan', () => {
  it('scans a real public repository', async () => {
    const ref = parseGitHubURL('https://github.com/auth0/node-jsonwebtoken')!;
    const plan = await planGitHub(ref, (p) => engine.isRelevant(p), { token: process.env.GITHUB_TOKEN });
    const report = await engine.scan(fetchGitHubFiles(plan), {
      source: { kind: 'github', name: 'auth0/node-jsonwebtoken' },
    });
    console.log(
      `live: ${report.stats.filesScanned} files, ${report.findings.length} findings, exposure ${report.scores.exposure}`,
    );
    expect(report.stats.filesScanned).toBeGreaterThan(10);
    expect(report.findings.length).toBeGreaterThan(0);
  }, 120_000);
});
