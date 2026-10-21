// Enforces the wording rules of PROJECT_SPEC.md §10.3 on all user-facing copy:
// pages, components, messages, fix texts and generated report language.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const web = join(__dirname, '..');
const root = join(web, '../..');
const BANNED = /\b(vulnerable|vulnerabilit(y|ies)|insecure|hackable|hacked|breached?|failing|shame(ful)?)\b/i;

// Identifiers and quoted spec text that legitimately contain a banned word.
const ALLOW = [/quantum-vulnerable crypto/i];

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'node_modules' || f === 'generated' ? [] : walk(p, exts);
    return exts.some((e) => p.endsWith(e)) ? [p] : [];
  });
}

const files = [
  ...walk(join(web, 'app'), ['.tsx', '.ts']),
  ...walk(join(web, 'components'), ['.tsx', '.ts']),
  ...walk(join(web, 'lib'), ['.ts']),
  ...walk(join(web, 'messages'), ['.json']),
  ...walk(join(root, 'packages/cbom-engine/fixes'), ['.md']),
  ...walk(join(root, 'packages/cbom-engine/rules'), ['.yaml']),
  ...walk(join(root, 'packages/cbom-engine/src/export'), ['.ts']),
];

describe('wording rules (§10.3)', () => {
  it('finds files to check', () => expect(files.length).toBeGreaterThan(10));
  it.each(files.map((f) => [relative(root, f), f]))('%s uses no alarmist wording', (_, f) => {
    const offending = readFileSync(f, 'utf8')
      .split('\n')
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => BANNED.test(line) && !ALLOW.some((a) => a.test(line)));
    expect(offending.map((o) => `${o.n}: ${o.line.trim()}`)).toEqual([]);
  });
});
