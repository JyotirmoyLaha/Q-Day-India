// Tree-sitter matching. Two rule forms:
//  - call rules: every call / constructor call is extracted once per file into
//    a CallSite (callee text, positional/keyword args, object-literal props),
//    then matched against data-only conditions from the YAML rules;
//  - query rules: a raw tree-sitter query whose @match capture is reported.
import { Query, type Language, type Node, type Tree } from 'web-tree-sitter';
import type { Rule, TreeLanguage } from '../types';

export type CallSite = {
  node: Node;
  callee: string;
  args: { value: string; literal: boolean }[];
  kwargs: Record<string, string>;
  props: Record<string, string>;
  text: string;
};

export type Hit = { node: Node; value?: string; keySizeText?: string; text: string };

const CALL_QUERIES: Record<TreeLanguage, string> = {
  python: '(call function: (_) @callee arguments: (_) @args) @call',
  javascript:
    '(call_expression function: (_) @callee arguments: (_) @args) @call (new_expression constructor: (_) @callee) @call',
  typescript:
    '(call_expression function: (_) @callee arguments: (_) @args) @call (new_expression constructor: (_) @callee) @call',
  tsx: '(call_expression function: (_) @callee arguments: (_) @args) @call (new_expression constructor: (_) @callee) @call',
  java: '(method_invocation) @call (object_creation_expression type: (_) @callee) @call',
  go: '(call_expression function: (_) @callee arguments: (_) @args) @call',
};

const queryCache = new Map<string, Query>();
export function getQuery(lang: Language, langName: string, source: string): Query {
  const key = `${langName}\u0000${source}`;
  let q = queryCache.get(key);
  if (!q) {
    q = new Query(lang, source);
    queryCache.set(key, q);
  }
  return q;
}

/** Literal value of a string/number node, or undefined for anything else. */
export function literalValue(n: Node): string | undefined {
  const t = n.text;
  switch (n.type) {
    case 'string': {
      // JS/TS 'x' "x"; Python r'x' b"x" '''x''' f-strings (f-strings with interpolation are not literals)
      if (n.children.some((c) => c?.type === 'interpolation')) return undefined;
      const m = /^[rRbBuUfF]{0,2}('''|"""|'|")([\s\S]*)\1$/.exec(t);
      return m ? m[2] : undefined;
    }
    case 'template_string':
      return n.children.some((c) => c?.type === 'template_substitution') ? undefined : t.slice(1, -1);
    case 'string_literal': // Java
    case 'interpreted_string_literal': // Go
    case 'raw_string_literal':
      return t.startsWith('"""') ? t.slice(3, -3) : t.slice(1, -1);
    case 'concatenated_string': {
      const parts = n.namedChildren.map((c) => (c ? literalValue(c) : undefined));
      return parts.every((p) => p !== undefined) ? parts.join('') : undefined;
    }
    case 'number':
    case 'integer':
    case 'decimal_integer_literal':
    case 'int_literal':
      return t.replace(/[_lL]/g, '');
    default:
      return undefined;
  }
}

function argValue(n: Node) {
  const lit = literalValue(n);
  return lit !== undefined ? { value: lit, literal: true } : { value: n.text, literal: false };
}

/** Collects key → value pairs from object / dict literals in the arguments. */
function collectProps(args: Node | null, out: Record<string, string>) {
  if (!args) return;
  for (const a of args.namedChildren) {
    if (!a || (a.type !== 'object' && a.type !== 'dictionary')) continue;
    for (const pair of a.namedChildren) {
      if (!pair || pair.type !== 'pair') continue;
      const k = pair.childForFieldName('key');
      const v = pair.childForFieldName('value');
      if (!k || !v) continue;
      const key = literalValue(k) ?? k.text;
      if (v.type === 'array' || v.type === 'list') {
        const first = v.namedChildren.find((c) => c && literalValue(c) !== undefined);
        if (first) out[key] = literalValue(first)!;
      } else {
        out[key] = literalValue(v) ?? v.text;
      }
    }
  }
}

export function extractCalls(tree: Tree, lang: Language, langName: TreeLanguage): CallSite[] {
  const q = getQuery(lang, langName, CALL_QUERIES[langName]);
  const out: CallSite[] = [];
  for (const m of q.matches(tree.rootNode)) {
    const call = m.captures.find((c) => c.name === 'call')?.node;
    if (!call) continue;
    let calleeNode = m.captures.find((c) => c.name === 'callee')?.node ?? null;
    let argsNode = m.captures.find((c) => c.name === 'args')?.node ?? null;
    let callee: string;
    if (langName === 'java' && call.type === 'method_invocation') {
      const obj = call.childForFieldName('object');
      const name = call.childForFieldName('name');
      callee = `${obj ? obj.text + '.' : ''}${name?.text ?? ''}`;
      argsNode = call.childForFieldName('arguments');
      calleeNode = name;
    } else if (call.type === 'new_expression' || call.type === 'object_creation_expression') {
      callee = `new ${calleeNode?.text ?? ''}`;
      argsNode = call.childForFieldName('arguments');
    } else {
      callee = calleeNode?.text ?? '';
    }
    callee = callee.replace(/\s+/g, '').replace(/\?\./g, '.').replace(/^new/, 'new ');
    const args: CallSite['args'] = [];
    const kwargs: Record<string, string> = {};
    const props: Record<string, string> = {};
    if (argsNode) {
      for (const a of argsNode.namedChildren) {
        if (!a || a.type === 'comment') continue;
        if (a.type === 'keyword_argument') {
          const k = a.childForFieldName('name');
          const v = a.childForFieldName('value');
          if (k && v) {
            if (v.type === 'list' || v.type === 'tuple') {
              const first = v.namedChildren.find((c) => c && literalValue(c) !== undefined);
              kwargs[k.text] = first ? literalValue(first)! : v.text;
            } else kwargs[k.text] = argValue(v).value;
          }
          continue;
        }
        if (a.type === 'list_splat' || a.type === 'dictionary_splat' || a.type === 'spread_element') continue;
        args.push(argValue(a));
      }
      collectProps(argsNode, props);
    }
    out.push({ node: call, callee, args, kwargs, props, text: call.text });
  }
  return out;
}

const reCache = new Map<string, RegExp>();
export function re(src: string, flags = 'i'): RegExp {
  const k = `${flags}|${src}`;
  let r = reCache.get(k);
  if (!r) {
    r = new RegExp(src, flags);
    reCache.set(k, r);
  }
  return r;
}

/** Resolves "arg0", "kwarg:x", "prop:x", "callee", "regex:<re>" against a call site. */
export function fromCall(site: CallSite, spec: string | undefined): string | undefined {
  if (!spec) return undefined;
  // "kwarg:key_size|arg0" tries each alternative in order.
  if (spec.includes('|') && !spec.startsWith('regex:')) {
    for (const alt of spec.split('|')) {
      const v = fromCall(site, alt);
      if (v !== undefined) return v;
    }
    return undefined;
  }
  if (spec === 'callee') return site.callee;
  if (spec === 'match') return site.text;
  const arg = /^arg(\d+)$/.exec(spec);
  if (arg) return site.args[Number(arg[1])]?.value;
  if (spec.startsWith('kwarg:')) return site.kwargs[spec.slice(6)];
  if (spec.startsWith('prop:')) return site.props[spec.slice(5)];
  if (spec.startsWith('regex:')) return re(spec.slice(6)).exec(site.text)?.[1];
  return undefined;
}

export function callMatches(rule: Rule, site: CallSite): boolean {
  // Callees are identifiers: match case-sensitively (generateKeyPair ≠ KEYUTIL.generateKeypair).
  if (rule.callee && !re(rule.callee, '').test(site.callee)) return false;
  for (const [i, cond] of Object.entries(rule.args ?? {})) {
    const a = site.args[Number(i)];
    if (!a || !re(cond).test(a.value)) return false;
  }
  for (const [k, cond] of Object.entries(rule.kwargs ?? {})) {
    const v = site.kwargs[k];
    if (v === undefined || !re(cond).test(v)) return false;
  }
  for (const [k, cond] of Object.entries(rule.props ?? {})) {
    const v = site.props[k];
    if (v === undefined || !re(cond).test(v)) return false;
  }
  return true;
}

/** Runs a raw-query rule and returns its hits. */
export function queryHits(rule: Rule, tree: Tree, lang: Language, langName: TreeLanguage): Hit[] {
  const q = getQuery(lang, langName, rule.query!);
  const hits: Hit[] = [];
  for (const m of q.matches(tree.rootNode)) {
    const node = (m.captures.find((c) => c.name === 'match') ?? m.captures[0])?.node;
    if (!node) continue;
    const cap = (spec?: string) => {
      if (!spec) return undefined;
      if (spec.startsWith('capture:')) {
        const n = m.captures.find((c) => c.name === spec.slice(8))?.node;
        return n ? (literalValue(n) ?? n.text) : undefined;
      }
      if (spec.startsWith('regex:')) return re(spec.slice(6)).exec(node.text)?.[1];
      if (spec === 'match') return node.text;
      return undefined;
    };
    hits.push({ node, value: cap(rule.variant_from), keySizeText: cap(rule.key_size), text: node.text });
  }
  return hits;
}
