#!/usr/bin/env node
// Compiles rules/*.yaml → generated/rules.json and fixes/*.md → generated/fixes.json,
// validating every rule so a typo fails the build instead of silently matching nothing.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(pkg, 'generated');
mkdirSync(out, { recursive: true });

const KINDS = ['treesitter', 'regex', 'pem', 'manifest'];
const LANGS = ['python', 'javascript', 'typescript', 'tsx', 'java', 'go'];
const PRIMITIVES = ['pke', 'signature', 'kem', 'key-agreement', 'hash', 'symmetric', 'mac', 'kdf', 'rng'];
const RISKS = ['HIGH', 'LOW', 'NONE', 'CLASSICAL_BROKEN'];
const CONF = ['high', 'medium', 'low'];
const ASSETS = ['algorithm', 'certificate', 'protocol', 'related-crypto-material'];
const ALIASES = { js: ['javascript', 'typescript', 'tsx'], ts: ['typescript', 'tsx'] };

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const checkRe = (where, src) => {
  try {
    new RegExp(src, 'i');
  } catch (e) {
    fail(where, `invalid regex ${JSON.stringify(src)}: ${e.message}`);
  }
};

// --- fixes ----------------------------------------------------------------------
const fixes = {};
for (const f of readdirSync(join(pkg, 'fixes')).filter((f) => f.endsWith('.md')).sort()) {
  const raw = readFileSync(join(pkg, 'fixes', f), 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) {
    fail(f, 'missing front matter');
    continue;
  }
  const meta = parse(m[1]);
  const body = m[2].trim();
  const sections = {};
  for (const s of body.split(/^## /m).slice(1)) {
    const nl = s.indexOf('\n');
    sections[s.slice(0, nl).trim().toLowerCase()] = s.slice(nl + 1).trim();
  }
  const code = (s) => {
    const c = s && /```(\w*)\n([\s\S]*?)\n```/.exec(s);
    return c ? { lang: c[1] || 'text', code: c[2] } : undefined;
  };
  for (const req of ['id', 'title', 'verified']) if (!meta[req]) fail(f, `front matter needs ${req}`);
  if (meta.id && `${meta.id}.md` !== f) fail(f, `file name must be ${meta.id}.md`);
  for (const s of ['why', 'replacement', 'caveats']) if (!sections[s]) fail(f, `missing "## ${s}" section`);
  fixes[meta.id] = {
    id: meta.id,
    title: meta.title,
    verified: String(meta.verified instanceof Date ? meta.verified.toISOString().slice(0, 10) : meta.verified),
    appliesTo: meta.applies ?? [],
    why: sections.why ?? '',
    replacement: sections.replacement ?? '',
    before: code(sections.before),
    after: code(sections.after),
    caveats: sections.caveats ?? '',
    references: (sections.references ?? '').split('\n').map((l) => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
    markdown: body,
  };
}

// --- rules ----------------------------------------------------------------------
const rules = [];
const ids = new Set();
for (const f of readdirSync(join(pkg, 'rules')).filter((f) => f.endsWith('.yaml')).sort()) {
  const doc = parse(readFileSync(join(pkg, 'rules', f), 'utf8')) ?? [];
  for (const r of doc) {
    const where = `${f}#${r.id ?? '?'}`;
    if (!r.id) fail(where, 'id required');
    if (ids.has(r.id)) fail(where, 'duplicate id');
    ids.add(r.id);
    if (!KINDS.includes(r.kind)) fail(where, `kind must be one of ${KINDS}`);
    if (!PRIMITIVES.includes(r.primitive)) fail(where, `bad primitive ${r.primitive}`);
    if (!RISKS.includes(r.quantum_risk)) fail(where, `bad quantum_risk ${r.quantum_risk}`);
    r.confidence ??= r.kind === 'treesitter' ? 'high' : 'medium';
    if (!CONF.includes(r.confidence)) fail(where, `bad confidence ${r.confidence}`);
    if (r.asset_type && !ASSETS.includes(r.asset_type)) fail(where, `bad asset_type ${r.asset_type}`);
    if (!r.message) fail(where, 'message required');
    if (!r.algorithm) fail(where, 'algorithm required');
    if (r.fix && !fixes[r.fix]) fail(where, `unknown fix ${r.fix}`);
    if (r.kind === 'treesitter') {
      const langs = [].concat(r.language ?? []).flatMap((l) => ALIASES[l] ?? [l]);
      if (!langs.length || langs.some((l) => !LANGS.includes(l))) fail(where, `bad language ${r.language}`);
      r.language = [...new Set(langs)];
      if (!r.query && !r.callee) fail(where, 'treesitter rules need query or callee');
      if (r.callee) checkRe(where, r.callee);
      for (const k of ['args', 'kwargs', 'props']) for (const v of Object.values(r[k] ?? {})) checkRe(where, v);
    }
    if (r.kind === 'regex') {
      if (!r.pattern) fail(where, 'regex rules need pattern');
      else
        try {
          new RegExp(r.pattern, (r.flags ?? 'i') + 'g');
        } catch (e) {
          fail(where, `invalid pattern: ${e.message}`);
        }
      if (!r.files?.length) fail(where, 'regex rules need files');
    }
    if (r.kind === 'manifest') {
      if (!r.libraries?.length) fail(where, 'manifest rules need libraries');
      for (const lib of r.libraries ?? []) {
        checkRe(where, lib.name);
        if (!PRIMITIVES.includes(lib.primitive)) fail(where, `library ${lib.name}: bad primitive`);
        if (!RISKS.includes(lib.quantum_risk)) fail(where, `library ${lib.name}: bad quantum_risk`);
        if (lib.fix && !fixes[lib.fix]) fail(where, `library ${lib.name}: unknown fix ${lib.fix}`);
      }
    }
    for (const v of r.variants ?? []) {
      checkRe(where, v.match);
      if (v.primitive && !PRIMITIVES.includes(v.primitive)) fail(where, `variant ${v.match}: bad primitive`);
      if (v.quantum_risk && !RISKS.includes(v.quantum_risk)) fail(where, `variant ${v.match}: bad risk`);
      if (v.fix && !fixes[v.fix]) fail(where, `variant ${v.match}: unknown fix ${v.fix}`);
    }
    rules.push(r);
  }
}

// Fixes referenced by built-in key-material findings.
for (const id of ['certificate-classical', 'private-key-in-repo', 'rsa-to-mlkem', 'signatures-to-mldsa', 'ssh-keys'])
  if (!fixes[id]) fail('builtin', `fix ${id} is required by the PEM scanner`);

if (errors.length) {
  console.error(`compile: ${errors.length} error(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
writeFileSync(join(out, 'rules.json'), JSON.stringify(rules, null, 1));
writeFileSync(join(out, 'fixes.json'), JSON.stringify(fixes, null, 1));
console.log(`compile: ${rules.length} rules, ${Object.keys(fixes).length} fixes`);
