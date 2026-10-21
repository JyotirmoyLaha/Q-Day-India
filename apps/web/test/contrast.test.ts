// WCAG AA contrast of the design tokens in app/globals.css, for both themes.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]));
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

// [foreground, background, minimum ratio]
const PAIRS: [string, string, number][] = [
  ['fg', 'bg', 4.5],
  ['fg', 'card', 4.5],
  ['fg', 'subtle', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'card', 4.5],
  ['muted', 'subtle', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'card', 4.5],
  ['accent-fg', 'accent', 4.5], // A+/A chips
  ['fg', 'accent-soft', 4.5], // B chip
  ['fg', 'exposed-soft', 4.5], // C/D chips
  ['fg', 'danger-soft', 4.5], // F chip
  ['exposed', 'card', 3], // bars / non-text
  ['danger', 'card', 3],
  ['fg', 'info-soft', 4.5],
  ['info', 'info-soft', 3], // icons
  ['exposed', 'exposed-soft', 3], // icons
  // Grade chips are solid colour with --chip-fg text in both themes.
  ['chip-fg', 'g-aplus', 4.5],
  ['chip-fg', 'g-a', 4.5],
  ['chip-fg', 'g-b', 4.5],
  ['chip-fg', 'g-c', 4.5],
  ['chip-fg', 'g-d', 4.5],
  ['chip-fg', 'g-f', 4.5],
];

describe.each([
  ['light', tokens(':root')],
  // Dark inherits every token it does not override.
  ['dark', { ...tokens(':root'), ...tokens(":root[data-theme='dark']") }],
])('%s theme contrast', (_, tk) => {
  it.each(PAIRS)('%s on %s ≥ %s', (fg, bg, min) => {
    expect(tk[fg], fg).toBeDefined();
    expect(tk[bg], bg).toBeDefined();
    expect(contrast(tk[fg]!, tk[bg]!)).toBeGreaterThanOrEqual(min);
  });
});
