#!/usr/bin/env node
// Bundles the CLI into a single ESM file plus its WASM files:
//   dist/cli.mjs, dist/wasm/*.wasm           (package bin)
//   ../../action/dist/cli.mjs, .../wasm/*    (GitHub Action, committed)
import { build } from 'esbuild';
import { chmodSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WASM_FILES } from './wasm-files.mjs';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(pkg, 'package.json'));
const targets = [join(pkg, 'dist'), join(pkg, '..', '..', 'action', 'dist')];

for (const out of targets) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'wasm'), { recursive: true });
  await build({
    entryPoints: [join(pkg, 'src', 'cli.ts')],
    outfile: join(out, 'cli.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    legalComments: 'none',
    banner: {
      js: "import { createRequire as __qdCreateRequire } from 'node:module'; const require = __qdCreateRequire(import.meta.url);",
    },
    logLevel: 'warning',
  });
  for (const [name, spec] of Object.entries(WASM_FILES)) {
    copyFileSync(require.resolve(spec), join(out, 'wasm', name));
    // npm ships some .wasm files as executable; normalise so the committed bundle is identical on every OS.
    chmodSync(join(out, 'wasm', name), 0o644);
  }
  console.log(`bundle: ${out}`);
}
