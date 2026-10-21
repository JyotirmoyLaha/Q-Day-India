// Node-only helpers: locate WASM in node_modules and walk a directory.
import { readFile, readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { WASM_FILES } from '../scripts/wasm-files.mjs';
import { createEngine, type Engine } from './engine';
import { pathSkipReason } from './files';
import type { SourceFile } from './types';

const require = createRequire(import.meta.url);

/** Locates WASM files: in a bundled build next to the script (wasmDir), else from node_modules. */
export function nodeWasmLocator(wasmDir?: string) {
  return async (file: string): Promise<Uint8Array> => {
    const spec = WASM_FILES[file];
    if (!wasmDir && !spec) throw new Error(`unknown WASM file ${file}`);
    const path = wasmDir ? join(wasmDir, file) : require.resolve(spec!);
    return new Uint8Array(await readFile(path));
  };
}

export const createNodeEngine = (wasmDir?: string): Promise<Engine> =>
  createEngine({ locateWasm: nodeWasmLocator(wasmDir) });

/** Yields every file under root (relative POSIX paths), skipping excluded directories early. */
export async function* walk(root: string, engine?: Engine): AsyncGenerator<SourceFile> {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(dir, e.name);
      const rel = relative(root, full).split(sep).join('/');
      if (e.isDirectory()) {
        if (pathSkipReason(`${rel}/x.js`) !== 'excluded-dir') stack.push(full);
        continue;
      }
      if (!e.isFile()) continue;
      if (engine && !engine.isRelevant(rel)) {
        yield { path: rel, content: '' }; // counted as seen, skipped as irrelevant
        continue;
      }
      const s = await stat(full);
      if (s.size > 512 * 1024) {
        yield { path: rel, content: 'x'.repeat(512 * 1024 + 1) }; // counted as too large
        continue;
      }
      yield { path: rel, content: await readFile(full, 'utf8') };
    }
  }
}
