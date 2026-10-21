// quantumbom CLI — used by the GitHub Action and for local scans.
//
//   quantumbom scan [dir] [--cbom f] [--sarif f] [--md f] [--json f]
//                         [--exclude glob]... [--fail-above N] [--name repo]
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNodeEngine, walk } from './node';
import { toCycloneDX } from './export/cyclonedx';
import { toSARIF } from './export/sarif';
import { toMarkdown } from './export/markdown';
import type { ScanReport } from './types';

type Args = {
  dir: string;
  cbom?: string;
  sarif?: string;
  md?: string;
  json?: string;
  exclude: string[];
  failAbove?: number;
  name?: string;
  quiet: boolean;
};

export function parseArgs(argv: string[]): Args {
  const a: Args = { dir: '.', exclude: [], quiet: false };
  const rest = [...argv];
  if (rest[0] === 'scan') rest.shift();
  while (rest.length) {
    const t = rest.shift()!;
    const val = () => {
      const v = rest.shift();
      if (v === undefined) throw new Error(`${t} needs a value`);
      return v;
    };
    switch (t) {
      case '--cbom':
        a.cbom = val();
        break;
      case '--sarif':
        a.sarif = val();
        break;
      case '--md':
        a.md = val();
        break;
      case '--json':
        a.json = val();
        break;
      case '--exclude':
        a.exclude.push(
          ...val()
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
        break;
      case '--fail-above':
        a.failAbove = Number(val());
        break;
      case '--name':
        a.name = val();
        break;
      case '--quiet':
        a.quiet = true;
        break;
      case '-h':
      case '--help':
        throw new Error('usage');
      default:
        if (t.startsWith('-')) throw new Error(`unknown option ${t}`);
        a.dir = t;
    }
  }
  return a;
}

async function out(path: string | undefined, data: string) {
  if (!path) return;
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(path, data);
}

export function summary(r: ScanReport): string {
  const by = (risk: string) => r.findings.filter((f) => f.quantumRisk === risk).length;
  return [
    `QuantumBOM — ${r.source.name}`,
    `  files analysed:     ${r.stats.filesScanned} (${r.stats.filesSeen} seen) in ${r.stats.durationMs} ms`,
    `  findings:           ${r.findings.length} (HIGH ${by('HIGH')}, classically weak ${by('CLASSICAL_BROKEN')}, LOW ${by('LOW')}, info ${by('NONE')})`,
    `  Quantum Exposure:   ${r.scores.exposure}/100`,
    `  Crypto-Agility:     ${r.scores.agility}/100`,
    ...r.warnings.map((w) => `  warning: ${w}`),
  ].join('\n');
}

export async function main(argv: string[]): Promise<number> {
  let a: Args;
  try {
    a = parseArgs(argv);
  } catch (e) {
    console.error(
      `${e instanceof Error && e.message !== 'usage' ? `error: ${e.message}\n` : ''}usage: quantumbom scan [dir] [--cbom file] [--sarif file] [--md file] [--json file] [--exclude glob[,glob]] [--fail-above N] [--name name]`,
    );
    return 2;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const bundledWasm = join(here, 'wasm');
  const engine = await createNodeEngine(existsSync(bundledWasm) ? bundledWasm : undefined);
  const root = resolve(a.dir);
  const report = await engine.scan(walk(root, engine), {
    source: { kind: 'local', name: a.name ?? root.split(/[\\/]/).pop() ?? 'repository' },
    exclude: a.exclude,
  });
  await out(a.cbom, JSON.stringify(toCycloneDX(report), null, 2));
  await out(a.sarif, JSON.stringify(toSARIF(report), null, 2));
  await out(a.md, toMarkdown(report));
  await out(a.json, JSON.stringify(report, null, 2));
  if (!a.quiet) console.log(summary(report));
  if (a.failAbove !== undefined && report.scores.exposure > a.failAbove) {
    console.error(`Quantum Exposure ${report.scores.exposure} is above the threshold ${a.failAbove}.`);
    return 1;
  }
  return 0;
}

const invoked = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) main(process.argv.slice(2)).then((code) => process.exit(code));
