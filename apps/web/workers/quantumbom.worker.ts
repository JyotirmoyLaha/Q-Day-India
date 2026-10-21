/// <reference lib="webworker" />
// QuantumBOM Web Worker: all fetching, unzipping and parsing happens here so the
// page stays responsive. Code never leaves the browser.
import { createEngine, type Engine, type SourceFile } from '@qday/cbom-engine';
import { fetchGitHubFiles, parseGitHubURL, planGitHub, SourceError, zipFiles } from '@/lib/sources';
import type { ScanRequest, WorkerMessage } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

let enginePromise: Promise<Engine> | null = null;
let controller: AbortController | null = null;

const post = (m: WorkerMessage) => self.postMessage(m);

function engine(): Promise<Engine> {
  enginePromise ??= createEngine({
    locateWasm: (file) => new URL(`/tree-sitter/${file}`, self.location.origin).href,
  });
  return enginePromise;
}

async function* withAbort<T>(it: AsyncIterable<T>, signal: AbortSignal): AsyncGenerator<T> {
  for await (const x of it) {
    if (signal.aborted) return;
    yield x;
  }
}

async function run(req: Extract<ScanRequest, { type: 'scan' }>) {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  post({ type: 'status', message: 'Loading parsers…' });
  const eng = await engine();
  const input = req.input;
  let files: AsyncIterable<SourceFile>;
  let filesTotal: number | undefined;
  let source: Parameters<Engine['scan']>[1]['source'];
  const warnings: string[] = [];

  if (input.kind === 'github') {
    const ref = parseGitHubURL(input.url);
    if (!ref) throw new SourceError('Enter a GitHub repository URL such as https://github.com/owner/repo.');
    post({ type: 'status', message: `Reading the file list of ${ref.owner}/${ref.repo}…` });
    const plan = await planGitHub(ref, (p) => eng.isRelevant(p), { token: input.token });
    if (plan.truncated)
      warnings.push(
        'GitHub truncated the file list for this very large repository; some files were not listed.',
      );
    filesTotal = Math.min(plan.files.length, 3000);
    if (plan.files.length > 3000)
      warnings.push(`Only the first 3,000 of ${plan.files.length} relevant files were analysed.`);
    post({
      type: 'status',
      message: `Downloading and analysing ${filesTotal} relevant files (of ${plan.totalBlobs})…`,
    });
    files = fetchGitHubFiles(plan, { signal, limit: 3000 });
    source = {
      kind: 'github',
      name: `${plan.owner}/${plan.repo}`,
      ref: `${plan.ref}@${plan.sha.slice(0, 7)}`,
      url: `https://github.com/${plan.owner}/${plan.repo}/tree/${plan.sha}`,
    };
  } else if (input.kind === 'zip') {
    post({ type: 'status', message: `Unzipping ${input.name} in your browser…` });
    files = zipFiles(input.data, (p) => eng.isRelevant(p));
    source = { kind: 'zip', name: input.name.replace(/\.zip$/i, '') };
  } else {
    files = [{ path: input.name, content: input.content }] as unknown as AsyncIterable<SourceFile>;
    filesTotal = 1;
    source = { kind: 'paste', name: input.name };
  }

  let last = 0;
  const report = await eng.scan(withAbort(files, signal), {
    source,
    filesTotal,
    onFindings: (findings) => post({ type: 'findings', findings }),
    onProgress: (p) => {
      const now = Date.now();
      if (now - last > 100 || p.filesDone === filesTotal) {
        last = now;
        post({ type: 'progress', ...p });
      }
    },
  });
  if (signal.aborted) return;
  report.warnings.unshift(...warnings);
  post({ type: 'done', report });
}

self.onmessage = (e: MessageEvent<ScanRequest>) => {
  const req = e.data;
  if (req.type === 'cancel') {
    controller?.abort();
    return;
  }
  run(req).catch((err: unknown) => {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  });
};
