// Rules and fixes are authored as YAML / Markdown (rules/, fixes/) and compiled
// to JSON by scripts/compile.mjs so the engine never needs a filesystem.
import rulesJSON from '../generated/rules.json';
import fixesJSON from '../generated/fixes.json';
import type { Fix, Rule } from './types';

export const RULES = rulesJSON as unknown as Rule[];
export const FIXES = fixesJSON as unknown as Record<string, Fix>;

export const getFix = (id: string | undefined): Fix | undefined => (id ? FIXES[id] : undefined);
