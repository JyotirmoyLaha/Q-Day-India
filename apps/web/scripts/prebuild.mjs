#!/usr/bin/env node
// Build-time data pipeline. Compiles repository data into compact JSON that the
// app imports (so pages, edge functions and badges never touch the filesystem
// at runtime), compiles the CBOM engine's rules/fixes and copies the
// tree-sitter WASM files into public/.
//
//   data/latest.json        → generated/latest.json
//   data/scans/*.json       → generated/history.json   (compact snapshots)
//   (latest)                → generated/badges.json    (host → grade, for /api/badge)
//   data/repos/*.json       → generated/repos.json     (repo → exposure, for /api/badge?repo=)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const web = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = join(web, '..', '..');
const out = join(web, 'generated');
mkdirSync(out, { recursive: true });

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (name, data) => writeFileSync(join(out, name), JSON.stringify(data));

// --- scans -----------------------------------------------------------------
const scansDir = join(root, 'data', 'scans');
const scanFiles = existsSync(scansDir)
  ? readdirSync(scansDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort()
  : [];

const empty = { scannedAt: new Date(0).toISOString(), scannerVersion: '0.0.0', goVersion: '', results: [] };
const latestPath = join(root, 'data', 'latest.json');
const latest = existsSync(latestPath) ? readJSON(latestPath) : empty;
write('latest.json', latest);

const snapshots = scanFiles.map((f) => {
  const scan = readJSON(join(scansDir, f));
  return {
    date: f.slice(0, 10),
    scannedAt: scan.scannedAt,
    rows: scan.results.map((r) => ({
      h: r.host,
      s: r.sector,
      g: r.grade,
      r: r.hndlRisk,
      cdn: r.http?.cdn ?? undefined,
      leg: r.tls?.legacyEnabled ?? false,
      v: r.verified,
      o: r.org,
    })),
  };
});
write('history.json', { snapshots });

const badges = {};
for (const r of latest.results)
  badges[r.host] = { g: r.grade, d: latest.scannedAt.slice(0, 10), v: r.verified };
write('badges.json', badges);

// --- repo results produced by the GitHub Action (dogfooding) ----------------
const reposDir = join(root, 'data', 'repos');
const repos = {};
if (existsSync(reposDir)) {
  for (const f of readdirSync(reposDir).filter((f) => f.endsWith('.json'))) {
    const r = readJSON(join(reposDir, f));
    if (r.repo) repos[r.repo.toLowerCase()] = r;
  }
}
write('repos.json', repos);

// --- CBOM engine: compile rules/fixes, copy WASM ------------------------------
const engine = join(root, 'packages', 'cbom-engine');
if (existsSync(join(engine, 'scripts', 'compile.mjs'))) {
  execFileSync(process.execPath, [join(engine, 'scripts', 'compile.mjs')], { stdio: 'inherit' });
  const wasmOut = join(web, 'public', 'tree-sitter');
  mkdirSync(wasmOut, { recursive: true });
  const require = createRequire(join(engine, 'package.json'));
  const { WASM_FILES } = await import(
    new URL(`file:///${join(engine, 'scripts', 'wasm-files.mjs').replace(/\\/g, '/')}`).href
  );
  for (const [name, spec] of Object.entries(WASM_FILES)) {
    copyFileSync(require.resolve(spec), join(wasmOut, name));
  }
}

console.log(
  `prebuild: ${latest.results.length} hosts in latest, ${snapshots.length} snapshots, ${Object.keys(repos).length} repos`,
);
