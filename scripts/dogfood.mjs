#!/usr/bin/env node
// Runs QuantumBOM (the bundled Action CLI) on this repository and records the
// result in data/repos/<name>.json, which feeds /api/badge?repo=OWNER/NAME.
//   node scripts/dogfood.mjs [owner/name]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = process.argv[2] ?? process.env.REPO_SLUG ?? 'JyotirmoyLaha/Q-Day-India';
const tmp = join(root, '.venv', 'tmp');
mkdirSync(tmp, { recursive: true });
const out = join(tmp, 'dogfood.json');
const exclude =
  'packages/cbom-engine/test/fixtures/**,scanner/internal/scan/scan_test.go,**/*.test.ts,**/*.test.tsx,apps/web/test/**';
execFileSync(
  process.execPath,
  [
    join(root, 'action', 'dist', 'cli.mjs'),
    'scan',
    root,
    '--name',
    repo,
    '--exclude',
    exclude,
    '--json',
    out,
  ],
  { stdio: 'inherit' },
);
const r = JSON.parse(readFileSync(out, 'utf8'));
const record = {
  repo,
  exposure: r.scores.exposure,
  agility: r.scores.agility,
  findings: r.findings.length,
  suppressed: r.stats.suppressed,
  filesScanned: r.stats.filesScanned,
  scannedAt: r.scannedAt,
  tool: `${r.tool.name} ${r.tool.version}`,
};
mkdirSync(join(root, 'data', 'repos'), { recursive: true });
const file = join(root, 'data', 'repos', `${repo.split('/').pop()}.json`);
writeFileSync(file, JSON.stringify(record, null, 2) + '\n');
console.log(`wrote ${file}`);
