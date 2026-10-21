// Dependency manifests: package.json, requirements*.txt, pyproject.toml, Pipfile,
// setup.py/cfg, pom.xml, build.gradle(.kts), go.mod.
import type { ManifestLibrary } from '../types';
import { basename } from '../files';

export type Dependency = { name: string; version?: string; line: number; ecosystem: ManifestLibrary['ecosystem'] };

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

function findLine(text: string, needle: string): number {
  const i = text.indexOf(needle);
  return i < 0 ? 1 : lineOf(text, i);
}

export function extractDependencies(path: string, text: string): Dependency[] {
  const b = basename(path);
  const deps: Dependency[] = [];
  if (b === 'package.json') {
    try {
      const j = JSON.parse(text) as Record<string, Record<string, string> | undefined>;
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        for (const [name, version] of Object.entries(j[field] ?? {}))
          deps.push({ name, version: String(version), line: findLine(text, `"${name}"`), ecosystem: 'npm' });
      }
      const engines = (j.engines as Record<string, string> | undefined)?.node;
      if (engines) deps.push({ name: 'node', version: engines, line: findLine(text, '"engines"'), ecosystem: 'npm' });
    } catch {
      // invalid JSON: ignore
    }
    return deps;
  }
  if (/^requirements.*\.txt$/i.test(b)) {
    text.split('\n').forEach((raw, i) => {
      const l = raw.replace(/#.*/, '').trim();
      const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?\s*(?:[<>=!~]=?\s*([\w.*+-]+))?/.exec(l);
      if (m && !l.startsWith('-')) deps.push({ name: m[1]!, version: m[2], line: i + 1, ecosystem: 'pypi' });
    });
    return deps;
  }
  if (b === 'pyproject.toml' || b === 'setup.py' || b === 'setup.cfg' || b === 'Pipfile') {
    text.split('\n').forEach((raw, i) => {
      const l = raw.replace(/#.*/, '');
      // PEP 508 strings: "cryptography>=42", 'pyjwt[crypto]'
      for (const m of l.matchAll(/["']([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?\s*(?:(?:[<>=!~]=?|\^)\s*([\w.*+-]+))?[^"']*["']/g))
        deps.push({ name: m[1]!, version: m[2], line: i + 1, ecosystem: 'pypi' });
      // Poetry / Pipfile tables: name = "^1.2"
      const t = /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*=\s*(?:\{[^}]*version\s*=\s*)?["']([^"']*)["']/.exec(l);
      if (t && !['name', 'version', 'description', 'python', 'readme', 'license', 'requires-python', 'build-backend'].includes(t[1]!))
        deps.push({ name: t[1]!, version: t[2]!.replace(/^[\^~>=<]+/, ''), line: i + 1, ecosystem: 'pypi' });
    });
    return deps;
  }
  if (b === 'pom.xml') {
    for (const m of text.matchAll(/<groupId>\s*([^<\s]+)\s*<\/groupId>\s*<artifactId>\s*([^<\s]+)\s*<\/artifactId>(?:\s*<version>\s*([^<\s]+)\s*<\/version>)?/g))
      deps.push({ name: `${m[1]}:${m[2]}`, version: m[3], line: lineOf(text, m.index!), ecosystem: 'maven' });
    return deps;
  }
  if (b === 'build.gradle' || b === 'build.gradle.kts') {
    for (const m of text.matchAll(/["']([\w.-]+):([\w.-]+)(?::([\w.+-]+))?["']/g))
      deps.push({ name: `${m[1]}:${m[2]}`, version: m[3], line: lineOf(text, m.index!), ecosystem: 'maven' });
    return deps;
  }
  if (b === 'go.mod') {
    text.split('\n').forEach((raw, i) => {
      const l = raw.replace(/\/\/.*/, '');
      const go = /^\s*go\s+(\d+\.\d+(?:\.\d+)?)\s*$/.exec(l);
      if (go) deps.push({ name: 'go', version: go[1], line: i + 1, ecosystem: 'go' });
      const m = /^\s*(?:require\s+)?([a-z0-9.-]+\.[a-z]{2,}\/[\w./-]+)\s+(v[\w.+-]+)/i.exec(l);
      if (m) deps.push({ name: m[1]!, version: m[2], line: i + 1, ecosystem: 'go' });
    });
    return deps;
  }
  return deps;
}

/** Compares dotted versions; returns true if v < threshold. Unparseable versions → false. */
export function versionBelow(v: string | undefined, threshold: string): boolean {
  if (!v) return false;
  const m = /(\d+(?:\.\d+)*)/.exec(v.replace(/^v/, ''));
  if (!m) return false;
  const a = m[1]!.split('.').map(Number);
  const b = threshold.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}
