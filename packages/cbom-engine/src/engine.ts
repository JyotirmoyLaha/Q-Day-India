// QuantumBOM engine: runs rules over files and assembles a ScanReport. It has
// no DOM or Node dependencies; WASM files are located through `locateWasm`.
import { Language, Parser, type Node } from 'web-tree-sitter';
import type { Finding, Rule, ScanReport, ScanSource, ScanStats, SourceFile, TreeLanguage, Variant } from './types';
import { classify, commentPrefixes, contentSkipReason, globToRegExp, MAX_FILES, matchesGlobs, normalizePath, pathSkipReason } from './files';
import { callMatches, extractCalls, fromCall, getQuery, queryHits, re } from './matchers/treesitter';
import { scanKeyMaterial } from './matchers/pem';
import { extractDependencies, versionBelow } from './matchers/manifest';
import { computeScores } from './scores';
import { RULES } from './rules';

export const ENGINE_VERSION = '1.0.0';
export const TOOL_NAME = 'QuantumBOM (Q-Day India)';

export type WasmLocator = (file: string) => string | Uint8Array | Promise<string | Uint8Array>;

export type EngineOptions = {
  /** Returns a path/URL or the bytes for a WASM file name from scripts/wasm-files.mjs. */
  locateWasm: WasmLocator;
  rules?: Rule[];
};

export type Progress = { filesDone: number; filesTotal?: number; findings: number; current?: string };

export type ScanOptions = {
  source: ScanSource;
  /** Paths (globs) to exclude, e.g. ["test/fixtures/**"]. */
  exclude?: string[];
  maxFiles?: number;
  onProgress?: (p: Progress) => void;
  onFindings?: (f: Finding[], file: string) => void;
  filesTotal?: number;
};

const GRAMMAR_FILE: Record<TreeLanguage, string> = {
  python: 'tree-sitter-python.wasm',
  javascript: 'tree-sitter-javascript.wasm',
  typescript: 'tree-sitter-typescript.wasm',
  tsx: 'tree-sitter-tsx.wasm',
  java: 'tree-sitter-java.wasm',
  go: 'tree-sitter-go.wasm',
};

type CompiledRegexRule = { rule: Rule; globs: RegExp[]; re: RegExp };

/** Redacts anything that looks like key material or a long secret from a snippet. */
export function redact(s: string): string {
  return s
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?(-----END [A-Z ]+-----|$)/g, '-----BEGIN …----- [redacted]')
    .replace(/[A-Za-z0-9+/=_-]{48,}/g, '[redacted]');
}

function snippetFor(lines: string[], startRow: number, endRow: number): string {
  return redact(
    lines
      .slice(startRow, Math.min(endRow, startRow + 2) + 1)
      .map((l) => (l.length > 200 ? l.slice(0, 200) + '…' : l).replace(/\s+$/, ''))
      .join('\n'),
  );
}

function parseKeySize(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const m = /(\d{2,5})/.exec(v);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n >= 64 && n <= 16384 ? n : undefined;
}

function pickVariant(rule: Rule, value: string | undefined): Variant | null | undefined {
  if (!rule.variants) return undefined; // rule has no variants: use base fields
  if (value === undefined) return null;
  return rule.variants.find((v) => re(v.match).test(value)) ?? null;
}

export class Engine {
  private langs = new Map<TreeLanguage, Language>();
  private parser!: Parser;
  private treeRules = new Map<TreeLanguage, Rule[]>();
  private regexRules: CompiledRegexRule[] = [];
  private manifestRules: Rule[] = [];
  readonly rules: Rule[];

  private constructor(
    private opts: EngineOptions,
    rules: Rule[],
  ) {
    this.rules = rules;
    for (const r of rules) {
      if (r.kind === 'treesitter')
        for (const l of r.language ?? []) this.treeRules.set(l, [...(this.treeRules.get(l) ?? []), r]);
      else if (r.kind === 'regex')
        this.regexRules.push({
          rule: r,
          globs: (r.files ?? ['*']).map(globToRegExp),
          re: new RegExp(r.pattern!, (r.flags ?? 'i').replace('g', '') + 'g'),
        });
      else if (r.kind === 'manifest') this.manifestRules.push(r);
    }
  }

  static async create(opts: EngineOptions): Promise<Engine> {
    const runtime = await opts.locateWasm('web-tree-sitter.wasm');
    await Parser.init(
      typeof runtime === 'string'
        ? { locateFile: () => runtime }
        : { wasmBinary: runtime as Uint8Array<ArrayBuffer> },
    );
    const e = new Engine(opts, opts.rules ?? RULES);
    e.parser = new Parser();
    return e;
  }

  private async language(l: TreeLanguage): Promise<Language> {
    let lang = this.langs.get(l);
    if (!lang) {
      lang = await Language.load(await this.opts.locateWasm(GRAMMAR_FILE[l]));
      this.langs.set(l, lang);
    }
    return lang;
  }

  /** Compiles every raw query for every language it targets; returns error messages. */
  async validateQueries(): Promise<string[]> {
    const errors: string[] = [];
    for (const [l, rules] of this.treeRules) {
      const lang = await this.language(l);
      for (const r of rules.filter((x) => x.query)) {
        try {
          getQuery(lang, l, r.query!);
        } catch (e) {
          errors.push(`${r.id} (${l}): ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
    return errors;
  }

  /** Cheap name-based check: is this path worth downloading/reading? */
  isRelevant(path: string): boolean {
    const p = normalizePath(path);
    if (pathSkipReason(p)) return false;
    const c = classify(p);
    if (c && c.kind !== 'config') return true;
    // Config files (and extension-less ones like sshd_config or nginx sites-enabled/*)
    // are relevant only if some regex rule targets them.
    return this.regexRules.some((r) => matchesGlobs(p, r.globs, r.rule.files ?? ['*']));
  }

  /** Analyses one file. Returns findings sorted by position. */
  async scanFile(file: SourceFile): Promise<Finding[]> {
    const path = normalizePath(file.path);
    const text = file.content.replace(/\r\n?/g, '\n');
    const lines = text.split('\n');
    const c = classify(path);
    const out: Finding[] = [];

    if (c?.kind === 'tree') out.push(...(await this.scanTree(path, text, lines, c.language)));
    if (c?.kind === 'manifest') out.push(...this.scanManifest(path, text));
    out.push(...this.scanRegex(path, text, lines));
    if (c?.kind === 'key' || text.includes('-----BEGIN ') || /(?:^|\s)(ssh-rsa|ssh-ed25519|ssh-dss|ecdsa-sha2-nistp\d+) AAAA/.test(text))
      out.push(...scanKeyMaterial(path, text));

    const seen = new Set<string>();
    return out
      .filter((f) => {
        const k = `${f.ruleId}:${f.line}:${f.column}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.line - b.line || a.column - b.column || a.ruleId.localeCompare(b.ruleId));
  }

  private finding(rule: Rule, variant: Variant | undefined, file: string, node: { row: number; col: number }, snippet: string, keySize?: number, parameter?: string): Finding {
    const v: Partial<Variant> = variant ?? {};
    return {
      ruleId: rule.id,
      file,
      line: node.row + 1,
      column: node.col + 1,
      snippet,
      algorithm: v.algorithm ?? rule.algorithm,
      keySize: v.key_size ?? keySize,
      primitive: v.primitive ?? rule.primitive,
      quantumRisk: v.quantum_risk ?? rule.quantum_risk,
      confidence: v.confidence ?? rule.confidence,
      fixId: v.fix ?? rule.fix,
      message: v.message ?? rule.message,
      assetType: v.asset_type ?? rule.asset_type ?? 'algorithm',
      kind: rule.kind,
      parameter: v.parameter ?? parameter,
    };
  }

  private async scanTree(path: string, text: string, lines: string[], l: TreeLanguage): Promise<Finding[]> {
    const rules = this.treeRules.get(l) ?? [];
    if (rules.length === 0) return [];
    const lang = await this.language(l);
    this.parser.setLanguage(lang);
    const tree = this.parser.parse(text);
    if (!tree) return [];
    const out: Finding[] = [];
    const at = (n: Node) => ({ row: n.startPosition.row, col: n.startPosition.column });
    try {
      const callRules = rules.filter((r) => !r.query);
      if (callRules.length) {
        for (const site of extractCalls(tree, lang, l)) {
          for (const rule of callRules) {
            if (!callMatches(rule, site)) continue;
            const variant = pickVariant(rule, fromCall(site, rule.variant_from ?? (rule.variants ? 'arg0' : undefined)));
            if (variant === null || variant?.skip) continue;
            out.push(
              this.finding(
                rule,
                variant,
                path,
                at(site.node),
                snippetFor(lines, site.node.startPosition.row, site.node.endPosition.row),
                parseKeySize(fromCall(site, rule.key_size)),
                fromCall(site, rule.parameter),
              ),
            );
          }
        }
      }
      for (const rule of rules.filter((r) => r.query)) {
        for (const hit of queryHits(rule, tree, lang, l)) {
          const variant = pickVariant(rule, hit.value);
          if (variant === null || variant?.skip) continue;
          out.push(
            this.finding(rule, variant, path, at(hit.node), snippetFor(lines, hit.node.startPosition.row, hit.node.endPosition.row), parseKeySize(hit.keySizeText)),
          );
        }
      }
    } finally {
      tree.delete();
    }
    return out;
  }

  private scanRegex(path: string, text: string, lines: string[]): Finding[] {
    const out: Finding[] = [];
    const prefixes = commentPrefixes(path);
    let lineStarts: number[] | null = null;
    for (const { rule, globs, re: rx } of this.regexRules) {
      if (!matchesGlobs(path, globs, rule.files ?? ['*'])) continue;
      rx.lastIndex = 0;
      for (const m of text.matchAll(rx)) {
        if (!lineStarts) {
          lineStarts = [0];
          for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);
        }
        const idx = m.index!;
        let row = 0;
        for (let lo = 0, hi = lineStarts.length - 1; lo <= hi; ) {
          const mid = (lo + hi) >> 1;
          if (lineStarts[mid]! <= idx) {
            row = mid;
            lo = mid + 1;
          } else hi = mid - 1;
        }
        const lineText = lines[row] ?? '';
        if (prefixes.some((p) => lineText.trimStart().startsWith(p))) continue;
        const group = (spec?: string) => {
          if (!spec) return undefined;
          if (spec === 'match') return m[0];
          if (spec.startsWith('group:')) return m.groups?.[spec.slice(6)];
          return undefined;
        };
        const variant = pickVariant(rule, group(rule.variant_from ?? (rule.variants ? 'group:alg' : undefined)));
        if (variant === null || variant?.skip) continue;
        const endRow = row + (m[0].match(/\n/g)?.length ?? 0);
        out.push(this.finding(rule, variant, path, { row, col: idx - lineStarts[row]! }, snippetFor(lines, row, endRow), parseKeySize(group(rule.key_size)), group(rule.parameter)));
      }
    }
    return out;
  }

  private scanManifest(path: string, text: string): Finding[] {
    const deps = extractDependencies(path, text);
    const out: Finding[] = [];
    const lines = text.split('\n');
    for (const rule of this.manifestRules) {
      for (const lib of rule.libraries ?? []) {
        for (const d of deps) {
          if (lib.ecosystem !== 'any' && lib.ecosystem !== d.ecosystem) continue;
          if (!re(`^(?:${lib.name})$`).test(d.name)) continue;
          if (lib.version_below && !versionBelow(d.version, lib.version_below)) continue;
          out.push({
            ruleId: rule.id,
            file: path,
            line: d.line,
            column: 1,
            snippet: snippetFor(lines, d.line - 1, d.line - 1).trim(),
            algorithm: lib.algorithm,
            primitive: lib.primitive,
            quantumRisk: lib.quantum_risk,
            confidence: lib.confidence ?? rule.confidence,
            fixId: lib.fix ?? rule.fix,
            message: lib.message.replace('{version}', d.version ?? 'unspecified').replace('{name}', d.name),
            assetType: 'algorithm',
            kind: 'manifest',
            details: { dependency: d.name, ...(d.version ? { version: d.version } : {}) },
          });
        }
      }
    }
    return out;
  }

  /** Scans a stream of files, enforcing limits, and returns the full report. */
  async scan(files: Iterable<SourceFile> | AsyncIterable<SourceFile>, o: ScanOptions): Promise<ScanReport> {
    const started = Date.now();
    const maxFiles = o.maxFiles ?? MAX_FILES;
    const excludes = (o.exclude ?? []).map((g) => globToRegExp(g.includes('/') || g.startsWith('**') ? g : `**/${g}`));
    const stats: ScanStats = { filesSeen: 0, filesScanned: 0, skipped: {}, bytesScanned: 0, durationMs: 0, byLanguage: {} };
    const findings: Finding[] = [];
    const warnings: string[] = [];
    const skip = (r: keyof ScanStats['skipped']) => (stats.skipped[r] = (stats.skipped[r] ?? 0) + 1);

    for await (const f of files as AsyncIterable<SourceFile>) {
      stats.filesSeen++;
      const path = normalizePath(f.path);
      if (excludes.some((x) => x.test(path))) {
        skip('excluded-dir');
        continue;
      }
      const pre = pathSkipReason(path);
      if (pre || !this.isRelevant(path)) {
        skip(pre ?? 'irrelevant');
        continue;
      }
      const post = contentSkipReason(path, f.content);
      if (post) {
        skip(post);
        continue;
      }
      if (stats.filesScanned >= maxFiles) {
        skip('cap');
        continue;
      }
      stats.filesScanned++;
      stats.bytesScanned += f.content.length;
      const c = classify(path);
      const langKey = c?.kind === 'tree' || c?.kind === 'regex-source' ? c.language : (c?.kind ?? 'other');
      stats.byLanguage[langKey] = (stats.byLanguage[langKey] ?? 0) + 1;
      try {
        const fs = await this.scanFile({ path, content: f.content });
        if (fs.length) {
          findings.push(...fs);
          o.onFindings?.(fs, path);
        }
      } catch (err) {
        warnings.push(`Could not analyse ${path}: ${err instanceof Error ? err.message : String(err)}`);
      }
      o.onProgress?.({ filesDone: stats.filesScanned, filesTotal: o.filesTotal, findings: findings.length, current: path });
    }
    if (stats.skipped.cap) warnings.push(`Only the first ${maxFiles} relevant files were analysed; ${stats.skipped.cap} more were skipped.`);
    stats.durationMs = Date.now() - started;
    findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
    return {
      tool: { name: TOOL_NAME, version: ENGINE_VERSION },
      scannedAt: new Date().toISOString(),
      source: o.source,
      stats,
      findings,
      scores: computeScores(findings, stats.filesScanned),
      warnings,
    };
  }
}

export const createEngine = (opts: EngineOptions) => Engine.create(opts);
