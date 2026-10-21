import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeGrade, hndlRisk, shelfLife, SHELF_DEFAULTS } from '@/lib/grading';
import type { Grade } from '@/lib/types';

const cases = JSON.parse(readFileSync(join(__dirname, '../../../schemas/grading-cases.json'), 'utf8')) as {
  grades: { name: string; in: Parameters<typeof computeGrade>[0]; grade: Grade | null }[];
  hndl: { grade: Grade | null; sector: string; shelf: number; risk: number }[];
  shelfDefaults: Record<string, number>;
};

describe('grading parity with the Go scanner (schemas/grading-cases.json)', () => {
  it.each(cases.grades)('$name', (c) => {
    expect(computeGrade(c.in)).toBe(c.grade);
  });
  it.each(cases.hndl)('HNDL $grade $sector $shelf → $risk', (c) => {
    expect(hndlRisk(c.grade, c.sector, c.shelf)).toBe(c.risk);
  });
  it('shelf-life defaults match', () => {
    expect(SHELF_DEFAULTS).toEqual(cases.shelfDefaults);
    expect(shelfLife('banking', 30)).toBe(30);
    expect(shelfLife('nope')).toBe(SHELF_DEFAULTS.other);
  });
  it('risk always within 0..100', () => {
    for (const g of ['A+', 'A', 'B', 'C', 'D', 'F', null] as const)
      for (const y of [-3, 0, 5, 25, 99]) {
        const r = hndlRisk(g, 'government', y);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(100);
      }
  });
});
