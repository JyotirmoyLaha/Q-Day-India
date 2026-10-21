import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { getLatest, getSites, summarise } from '@/lib/data';
import { filterRows, type IndexRow } from '@/components/IndexTable';
import { siteFixes } from '@/lib/siteFixes';
import { certAlgorithm, formatDate, formatMonth, issuerName } from '@/lib/format';
import type { ScanFile, SiteResult } from '@/lib/types';

const root = join(__dirname, '../../..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/scan.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const recorded = (name: string) =>
  JSON.parse(readFileSync(join(root, 'scanner/testdata/recorded', name), 'utf8')) as SiteResult;
const wrap = (results: SiteResult[]): ScanFile => ({
  scannedAt: '2026-10-21T03:17:00Z',
  scannerVersion: '1.0.0',
  goVersion: 'go1.27.3',
  results,
});

describe('scan schema', () => {
  it('accepts recorded scanner output', () => {
    const files = readdirSync(join(root, 'scanner/testdata/recorded'));
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const f of files) expect(validate(wrap([recorded(f)])), JSON.stringify(validate.errors)).toBe(true);
  });
  it('accepts the committed data/latest.json', () => {
    expect(validate(getLatest())).toBe(true);
  });
  it('rejects contract violations', () => {
    const cf = recorded('cloudflare.com.json');
    expect(validate(wrap([{ ...cf, grade: 'S' as never }]))).toBe(false);
    expect(validate(wrap([{ ...cf, hndlRisk: 101 }]))).toBe(false);
    expect(validate(wrap([{ ...cf, reachable: false }]))).toBe(false); // unreachable needs error + null grade
    expect(validate(wrap([{ ...cf, sector: 'crypto' as never }]))).toBe(false);
  });
});

describe('summary', () => {
  it('counts grades and sectors over reachable hosts', () => {
    const s = summarise([recorded('cloudflare.com.json'), recorded('www.aiims.edu.json')]);
    expect(s.reachable).toBe(2);
    expect(s.quantumSafe).toBe(1);
    expect(s.exposed).toBe(1);
    expect(s.byGrade.D).toBe(1);
    expect(s.bySector.map((x) => x.sector)).toEqual(['healthcare', 'other']);
  });
  it('real data loads with history', () => {
    const sites = getSites();
    expect(sites.length).toBeGreaterThan(0);
    expect(sites[0]!.history.length).toBeGreaterThan(0);
  });
});

describe('index filters', () => {
  const rows: IndexRow[] = [
    {
      host: 'a.bank.in',
      org: 'Alpha Bank',
      sector: 'banking',
      verified: false,
      grade: 'C',
      hndlRisk: 60,
      history: [],
    },
    {
      host: 'b.gov.in',
      org: 'Beta Portal',
      sector: 'government',
      verified: true,
      grade: 'C',
      hndlRisk: 100,
      history: [],
    },
    {
      host: 'c.edu.in',
      org: 'Gamma Uni',
      sector: 'education',
      verified: false,
      grade: 'A+',
      hndlRisk: 0,
      history: [],
    },
    {
      host: 'd.in',
      org: 'Delta',
      sector: 'media',
      verified: false,
      grade: null,
      hndlRisk: 0,
      error: 'TIMEOUT',
      history: [],
    },
  ];
  it('sorts by HNDL exposure, ungraded last', () => {
    expect(filterRows(rows, '', '', '', 'risk').map((r) => r.host)).toEqual([
      'b.gov.in',
      'a.bank.in',
      'c.edu.in',
      'd.in',
    ]);
  });
  it('searches org and host, filters sector and grade', () => {
    expect(filterRows(rows, 'gamma', '', '', 'host').map((r) => r.host)).toEqual(['c.edu.in']);
    expect(filterRows(rows, 'bank.in', '', '', 'host')).toHaveLength(1);
    expect(filterRows(rows, '', 'government', '', 'host')).toHaveLength(1);
    expect(filterRows(rows, '', '', 'C', 'org').map((r) => r.org)).toEqual(['Alpha Bank', 'Beta Portal']);
    expect(filterRows(rows, '', '', 'none', 'host').map((r) => r.host)).toEqual(['d.in']);
  });
});

describe('site fixes', () => {
  it('a D-grade nginx site gets TLS 1.3, PQ, legacy and HSTS fixes, PQ first', () => {
    const ids = siteFixes(recorded('www.aiims.edu.json')).map((f) => f.id);
    expect(ids).toEqual(
      expect.arrayContaining(['enable-tls13', 'enable-pq-kex', 'disable-legacy', 'hsts', 'pq-certs']),
    );
    expect(ids.indexOf('enable-pq-kex')).toBeLessThan(ids.indexOf('hsts'));
  });
  it('an A site only gets legacy + certificate planning', () => {
    const ids = siteFixes(recorded('cloudflare.com.json')).map((f) => f.id);
    expect(ids).toEqual(['disable-legacy', 'pq-certs']);
  });
  it('every low grade is paired with a fix', () => {
    for (const s of getSites().filter((s) => s.grade && !['A+', 'A'].includes(s.grade)))
      expect(
        siteFixes(s).some((f) => f.priority === 1),
        s.host,
      ).toBe(true);
  });
});

describe('formatting', () => {
  it('formats dates and certs', () => {
    expect(formatDate('2026-10-21')).toBe('21 Oct 2026');
    expect(formatDate('2026-10-21T23:30:00Z')).toBe('21 Oct 2026');
    expect(formatMonth('2026-10')).toBe('October 2026');
    expect(issuerName('CN=WE1,O=Google Trust Services,C=US')).toBe('Google Trust Services (WE1)');
    expect(certAlgorithm(recorded('cloudflare.com.json').cert)).toBe('ECDSA P-256');
    expect(certAlgorithm(recorded('www.aiims.edu.json').cert)).toBe('RSA-2048');
  });
});
