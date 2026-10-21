// Minimal message catalogue. Strings live in messages/<locale>.json so Hindi and
// Bengali can be added later by dropping in hi.json / bn.json with the same keys.
import en from '@/messages/en.json';

export const LOCALES = ['en'] as const;
export type Locale = (typeof LOCALES)[number];

const catalogues: Record<Locale, unknown> = { en };

/** t('index.showing', { count: 3 }) → "Showing 3 of …". Missing keys return the key. */
export function t(key: string, vars?: Record<string, string | number>, locale: Locale = 'en'): string {
  let node: unknown = catalogues[locale];
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part];
    else return key;
  }
  if (typeof node !== 'string') return key;
  return vars ? node.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : node;
}

export const sectorLabel = (s: string) => t(`sectors.${s}`);
