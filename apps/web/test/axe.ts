import axe from 'axe-core';
import { expect } from 'vitest';

/** Runs axe-core on a rendered container. Colour contrast is checked separately
 *  (test/contrast.test.ts) because jsdom does no layout or CSS cascade. */
export async function expectNoAxeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join('\n  ')}`,
  );
  expect(summary, summary.join('\n')).toEqual([]);
}
