import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/cli';

describe('cli args', () => {
  it('parses outputs, excludes and threshold', () => {
    const a = parseArgs(['scan', 'repo', '--cbom', 'a.json', '--sarif', 'b.sarif', '--exclude', 'test/**,docs/**', '--exclude', 'x/**', '--fail-above', '70']);
    expect(a).toMatchObject({ dir: 'repo', cbom: 'a.json', sarif: 'b.sarif', failAbove: 70, exclude: ['test/**', 'docs/**', 'x/**'] });
  });
  it('rejects unknown options and missing values', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/unknown option/);
    expect(() => parseArgs(['--cbom'])).toThrow(/needs a value/);
  });
});
