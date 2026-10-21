// Which files to analyse, and how (§6.1 limits).
import type { SkipReason, TreeLanguage } from './types';

export const MAX_FILE_BYTES = 512 * 1024;
export const MAX_FILES = 3000;

const SKIP_DIRS = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  '.git',
  '.hg',
  '.svn',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
  '.tox',
  'bower_components',
  'third_party',
  '.gradle',
  '.idea',
  'target',
]);

const LOCKFILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'poetry.lock', 'go.sum', 'Cargo.lock', 'composer.lock']);

const TREE_EXT: Record<string, TreeLanguage> = {
  py: 'python',
  pyw: 'python',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  java: 'java',
  go: 'go',
};

/** Source languages handled by regex rules only (no tree-sitter grammar shipped). */
const REGEX_EXT: Record<string, string> = {
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',
  c: 'c',
  h: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
};

const KEY_EXT = new Set(['pem', 'crt', 'cer', 'key', 'pub', 'csr']);
const KEY_NAMES = /^(id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|authorized_keys2?|known_hosts|ssh_host_\w+_key(\.pub)?)$/;
const MANIFESTS = new Set(['package.json', 'pyproject.toml', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'go.mod', 'Pipfile', 'setup.py', 'setup.cfg']);
const CONFIG_NAME =
  /^(nginx\.conf|httpd\.conf|apache2?\.conf|ssl\.conf|haproxy\.cfg|openssl\.cnf|Dockerfile(\..+)?|Containerfile|.*\.dockerfile|\.htaccess|docker-compose.*\.ya?ml|Caddyfile|envoy\.ya?ml|traefik\.(ya?ml|toml)|sshd?_config)$/i;
const CONFIG_EXT = new Set(['conf', 'cnf', 'cfg', 'tf', 'tfvars', 'yaml', 'yml', 'hcl', 'ini', 'properties', 'toml', 'env', 'xml', 'json']);

export type FileClass =
  | { kind: 'tree'; language: TreeLanguage }
  | { kind: 'regex-source'; language: string }
  | { kind: 'key' }
  | { kind: 'manifest'; name: string }
  | { kind: 'config' };

export const basename = (p: string) => p.slice(p.lastIndexOf('/') + 1);
const ext = (p: string) => {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i + 1).toLowerCase() : '';
};

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
}

/** Returns why a path is skipped before reading it, or null if it may be analysed. */
export function pathSkipReason(path: string): SkipReason | null {
  const parts = normalizePath(path).split('/');
  if (parts.slice(0, -1).some((d) => SKIP_DIRS.has(d))) return 'excluded-dir';
  const b = parts[parts.length - 1] ?? '';
  if (/[.-]min\.(js|css|mjs)$/i.test(b) || /\.bundle\.js$/i.test(b) || /\.map$/i.test(b)) return 'minified';
  if (LOCKFILES.has(b)) return 'irrelevant';
  return null;
}

/** Classifies a path by name only (cheap enough to filter a GitHub tree before downloading). */
export function classify(path: string): FileClass | null {
  const p = normalizePath(path);
  const b = basename(p);
  const e = ext(p);
  if (MANIFESTS.has(b) || /^requirements.*\.txt$/i.test(b)) return { kind: 'manifest', name: b };
  if (KEY_EXT.has(e) || KEY_NAMES.test(b)) return { kind: 'key' };
  const tl = TREE_EXT[e];
  if (tl) return { kind: 'tree', language: tl };
  const rl = REGEX_EXT[e];
  if (rl) return { kind: 'regex-source', language: rl };
  if (CONFIG_NAME.test(b) || CONFIG_EXT.has(e)) return { kind: 'config' };
  return null;
}

/** Content-based skip checks (after reading). */
export function contentSkipReason(path: string, content: string, bytes = content.length): SkipReason | null {
  if (bytes > MAX_FILE_BYTES) return 'too-large';
  if (content.includes('\u0000')) return 'binary';
  const c = classify(path);
  if (c && (c.kind === 'tree' || c.kind === 'regex-source') && content.length > 5000) {
    // Minified code: very long average line length.
    const lines = content.split('\n').length;
    if (content.length / lines > 400) return 'minified';
  }
  return null;
}

/** Simple glob → RegExp (supports *, ? and **). Globs without "/" match the basename. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i]!;
    if (ch === '*') {
      if (glob[i + 1] === '*') {
        re += '.*';
        i++;
        if (glob[i + 1] === '/') i++;
      } else re += '[^/]*';
    } else if (ch === '?') re += '[^/]';
    else re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}

export function matchesGlobs(path: string, globs: RegExp[], raw: string[]): boolean {
  const p = normalizePath(path);
  const b = basename(p);
  return globs.some((g, i) => g.test(raw[i]!.includes('/') ? p : b));
}

/** Line-comment prefixes per file type, so regex rules don't fire on commented-out config. */
export function commentPrefixes(path: string): string[] {
  const e = ext(path);
  const b = basename(path);
  if (['kt', 'kts', 'scala', 'c', 'h', 'cc', 'cpp', 'cxx', 'hpp', 'cs', 'rs', 'swift', 'go', 'java', 'js', 'ts'].includes(e))
    return ['//', '/*', '*'];
  if (e === 'php') return ['//', '#', '/*', '*'];
  if (e === 'ini' || e === 'cnf') return ['#', ';'];
  if (e === 'xml') return ['<!--'];
  if (/^Dockerfile/i.test(b) || ['conf', 'cfg', 'tf', 'tfvars', 'hcl', 'yaml', 'yml', 'toml', 'env', 'properties', 'rb', 'py', 'txt'].includes(e))
    return ['#', '//'];
  return ['#', '//'];
}
