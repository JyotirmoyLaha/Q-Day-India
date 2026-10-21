import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding, ScanReport } from '@qday/cbom-engine';
import { computeScores } from '@qday/cbom-engine';
import { migrationYearsFromFindings, mosca, moscaHeadline } from '@/lib/mosca';
import { buildPlan, defaultTrack } from '@/lib/plan';
import { buildMonthReport, reportMonths } from '@/lib/report';
import { getSnapshots } from '@/lib/data';
import type { SiteResult, Snapshot } from '@/lib/types';
import QdayPage from '@/app/qday/page';
import LearnPage from '@/app/learn/page';
import OrgPage from '@/app/org/page';
import CheckPage from '@/app/check/page';
import ReportPage from '@/app/report/[month]/page';
import { expectNoAxeViolations } from './axe';

const recorded = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, '../../../scanner/testdata/recorded', name), 'utf8')) as SiteResult;

describe('Mosca', () => {
  it('computes late / margin', () => {
    expect(moscaHeadline(mosca(25, 5, 10))).toBe('You are 20 years late');
    expect(moscaHeadline(mosca(1, 1, 10))).toBe('You have 8 years of margin');
    expect(moscaHeadline(mosca(5, 4, 10))).toBe('You have 1 year of margin');
    expect(moscaHeadline(mosca(5, 5, 10))).toBe('You have no margin left');
  });
  it('migration heuristic grows slowly and is bounded', () => {
    expect(migrationYearsFromFindings(0)).toBe(1);
    expect(migrationYearsFromFindings(10)).toBeGreaterThan(migrationYearsFromFindings(1));
    expect(migrationYearsFromFindings(1e9)).toBe(15);
  });
});

const f = (over: Partial<Finding>): Finding => ({
  ruleId: 'r',
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
const codeReport = (findings: Finding[]): ScanReport => ({
  tool: { name: 'q', version: '1' },
  scannedAt: '2026-10-21T00:00:00Z',
  source: { kind: 'zip', name: 'bank-app' },
  stats: {
    filesSeen: 3,
    filesScanned: 3,
    skipped: {},
    bytesScanned: 1,
    durationMs: 1,
    byLanguage: {},
    suppressed: 0,
  },
  findings,
  scores: computeScores(findings, 3),
  warnings: [],
});

describe('migration plan', () => {
  it('orders public TLS → inventory → classical-broken → key exchange → signatures → symmetric, with DST deadlines', () => {
    const plan = buildPlan(
      recorded('www.aiims.edu.json'),
      codeReport([
        f({ primitive: 'signature' }),
        f({ primitive: 'key-agreement', algorithm: 'ECDH' }),
        f({ quantumRisk: 'CLASSICAL_BROKEN', primitive: 'hash', algorithm: 'MD5' }),
        f({ quantumRisk: 'LOW', primitive: 'symmetric', algorithm: 'AES-128' }),
      ]),
      'enterprise',
    );
    const areas = plan.map((p) => p.area);
    const firstIdx = (a: string) => areas.indexOf(a as never);
    expect(firstIdx('Public TLS')).toBe(0);
    expect(firstIdx('Inventory')).toBeLessThan(firstIdx('Key exchange in code'));
    expect(firstIdx('Hashes & legacy ciphers')).toBeLessThan(firstIdx('Key exchange in code'));
    expect(firstIdx('Key exchange in code')).toBeLessThan(firstIdx('Signatures & certificates'));
    expect(firstIdx('Signatures & certificates')).toBeLessThan(firstIdx('Symmetric strength'));
    expect(plan.find((p) => p.title.includes('hybrid post-quantum key exchange'))?.deadline).toBe(2028);
    expect(plan.find((p) => p.area === 'Key exchange in code')?.deadline).toBe(2030);
    expect(plan.map((p) => p.order)).toEqual(plan.map((_, i) => i + 1));
  });
  it('CII track uses the accelerated years', () => {
    const plan = buildPlan(null, codeReport([f({ primitive: 'kem' })]), 'cii');
    expect(plan.find((p) => p.area === 'Key exchange in code')?.deadline).toBe(2028);
    expect(defaultTrack('telecom')).toBe('cii');
    expect(defaultTrack('banking')).toBe('enterprise');
  });
});

describe('monthly report', () => {
  const row = (
    h: string,
    s: Snapshot['rows'][number]['s'],
    g: Snapshot['rows'][number]['g'],
    cdn?: string,
    leg = false,
  ) => ({ h, s, g, r: 0, cdn: cdn as never, leg, v: false, o: h });
  const snaps: Snapshot[] = [
    {
      date: '2026-09-28',
      scannedAt: '2026-09-28T03:17:00Z',
      rows: [
        row('a.in', 'banking', 'C'),
        row('b.in', 'banking', 'A+', 'cloudflare'),
        row('c.in', 'media', 'D', undefined, true),
      ],
    },
    {
      date: '2026-10-05',
      scannedAt: '2026-10-05T03:17:00Z',
      rows: [
        row('a.in', 'banking', 'A', 'akamai'),
        row('b.in', 'banking', 'A+', 'cloudflare'),
        row('c.in', 'media', 'F', undefined, true),
        row('d.in', 'government', null),
      ],
    },
  ];
  it('computes shares, movers vs the previous month, CDN effect and stragglers', () => {
    const r = buildMonthReport(snaps, '2026-10')!;
    expect(r.reachable).toBe(3);
    expect(r.safeShare).toBe(67);
    expect(r.baselineDate).toBe('2026-09-28');
    expect(r.movers.map((m) => [m.host, m.direction])).toEqual([
      ['a.in', 'up'],
      ['c.in', 'down'],
    ]);
    expect(r.cdn).toMatchObject({
      behindCdn: 2,
      behindCdnSafe: 2,
      selfHosted: 1,
      selfHostedSafe: 0,
      cdnShare: 100,
      selfShare: 0,
    });
    expect(r.stragglers.map((s) => s.host)).toEqual(['c.in']);
    expect(r.summary.join(' ')).not.toMatch(/vulnerable|insecure|hacked|breach|failing|shame/i);
    expect(reportMonths(snaps)).toEqual(['2026-09', '2026-10']);
    expect(buildMonthReport(snaps, '2025-01')).toBeNull();
  });
  it('first-ever report explains that movers come later', () => {
    const r = buildMonthReport([snaps[0]!], '2026-09')!;
    expect(r.summary.join(' ')).toMatch(/first scan/);
  });
});

describe('glue pages render accessibly', () => {
  it('/qday', async () => {
    const { container } = render(<QdayPage />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/years (late|of margin)|no margin/);
    fireEvent.change(screen.getByRole('slider', { name: /X — how long/ }), { target: { value: '25' } });
    fireEvent.change(screen.getByRole('slider', { name: /Z — years until/ }), { target: { value: '10' } });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('You are 20 years late');
    await expectNoAxeViolations(container);
  });
  it('/learn', async () => {
    const { container } = render(<LearnPage />);
    expect(screen.getByRole('img', { name: /Harvest now, decrypt later/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Pick a number a/), { target: { value: '7' } });
    expect(screen.getByText(/period r = 4/)).toBeTruthy();
    await expectNoAxeViolations(container);
  });
  it('/org and /check', async () => {
    const o = render(<OrgPage />);
    await expectNoAxeViolations(o.container);
    o.unmount();
    const c = render(<CheckPage />);
    await expectNoAxeViolations(c.container);
  });
  it('/report/[month] with real data', async () => {
    const month = reportMonths(getSnapshots()).at(-1)!;
    const { container } = render(await ReportPage({ params: Promise.resolve({ month }) }));
    expect(screen.getByText(/In plain language/)).toBeTruthy();
    await expectNoAxeViolations(container);
  });
});
