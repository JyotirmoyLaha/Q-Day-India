// Inputs for the code scanner (§6.1). Everything runs in the browser (Web Worker).
// Network calls go only to api.github.com and raw.githubusercontent.com; a
// GitHub token, if given, is sent only to api.github.com.
import JSZip from 'jszip';
import type { SourceFile } from '@qday/cbom-engine';

export type RepoRef = { owner: string; repo: string; ref?: string; subpath?: string };

/** Accepts https://github.com/o/r, github.com/o/r/tree/branch/dir, o/r, git@github.com:o/r.git */
export function parseGitHubURL(input: string): RepoRef | null {
  const s = input
    .trim()
    .replace(/\.git$/, '')
    .replace(/\/+$/, '');
  let m =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob)\/([^/]+)(?:\/(.+))?)?$/i.exec(
      s,
    );
  if (!m) m = /^git@github\.com:([\w.-]+)\/([\w.-]+)$/i.exec(s);
  if (!m) m = /^([\w.-]+)\/([\w.-]+)$/.exec(s);
  if (!m) return null;
  return { owner: m[1]!, repo: m[2]!, ref: m[3], subpath: m[4] };
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export class SourceError extends Error {}

type TreeEntry = { path: string; type: string; size?: number };

export type GitHubPlan = {
  owner: string;
  repo: string;
  sha: string;
  ref: string;
  files: TreeEntry[];
  truncated: boolean;
  totalBlobs: number;
};

const API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';

async function api<T>(
  fetchFn: FetchLike,
  path: string,
  token?: string,
  accept = 'application/vnd.github+json',
): Promise<T> {
  const headers: Record<string, string> = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchFn(`${API}${path}`, { headers });
  if (res.status === 404)
    throw new SourceError(
      'Repository not found. Only public repositories can be scanned by URL. Use a zip upload for private code.',
    );
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    const when = reset ? ` (resets ${new Date(reset * 1000).toLocaleTimeString()})` : '';
    throw new SourceError(
      `GitHub API rate limit reached${when}. Add a token (kept in memory only) or try again later.`,
    );
  }
  if (!res.ok) throw new SourceError(`GitHub API error ${res.status}`);
  return accept.includes('sha') ? ((await res.text()) as T) : ((await res.json()) as T);
}

/** Resolves the default branch, commit SHA and file list (3 API calls). */
export async function planGitHub(
  ref: RepoRef,
  isRelevant: (path: string) => boolean,
  opts: { token?: string; fetchFn?: FetchLike; maxFileBytes?: number } = {},
): Promise<GitHubPlan> {
  const fetchFn = opts.fetchFn ?? fetch;
  const { owner, repo } = ref;
  const meta = await api<{ default_branch: string; private?: boolean }>(
    fetchFn,
    `/repos/${owner}/${repo}`,
    opts.token,
  );
  if (meta.private)
    throw new SourceError(
      'This repository is private. Use a zip upload so your code never leaves the browser.',
    );
  const branch = ref.ref ?? meta.default_branch;
  const sha = (
    await api<string>(
      fetchFn,
      `/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`,
      opts.token,
      'application/vnd.github.sha',
    )
  ).trim();
  const tree = await api<{ tree: TreeEntry[]; truncated: boolean }>(
    fetchFn,
    `/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    opts.token,
  );
  const max = opts.maxFileBytes ?? 512 * 1024;
  const blobs = tree.tree.filter((e) => e.type === 'blob');
  const files = blobs.filter(
    (e) =>
      (!ref.subpath || e.path.startsWith(`${ref.subpath}/`)) && (e.size ?? 0) <= max && isRelevant(e.path),
  );
  return { owner, repo, sha, ref: branch, files, truncated: tree.truncated, totalBlobs: blobs.length };
}

/** Downloads planned files with bounded concurrency, yielding each as it arrives. No token is sent to raw.githubusercontent.com. */
export async function* fetchGitHubFiles(
  plan: GitHubPlan,
  opts: { fetchFn?: FetchLike; concurrency?: number; signal?: AbortSignal; limit?: number } = {},
): AsyncGenerator<SourceFile> {
  const fetchFn = opts.fetchFn ?? fetch;
  const queue = plan.files.slice(0, opts.limit ?? plan.files.length);
  const ready: SourceFile[] = [];
  let next = 0;
  let active = 0;
  let wake: (() => void) | null = null;
  const notify = () => {
    wake?.();
    wake = null;
  };
  const start = () => {
    while (active < (opts.concurrency ?? 8) && next < queue.length && !opts.signal?.aborted) {
      const entry = queue[next++]!;
      active++;
      const url = `${RAW}/${plan.owner}/${plan.repo}/${plan.sha}/${entry.path.split('/').map(encodeURIComponent).join('/')}`;
      fetchFn(url, { signal: opts.signal })
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => '')
        .then((content) => {
          ready.push({ path: entry.path, content });
          active--;
          notify();
        });
    }
  };
  start();
  while (ready.length || active || (next < queue.length && !opts.signal?.aborted)) {
    if (!ready.length) await new Promise<void>((r) => (wake = r));
    while (ready.length) yield ready.shift()!;
    start();
  }
}

/** Reads a zip entirely in memory. Nothing is uploaded. */
export async function* zipFiles(
  data: ArrayBuffer,
  isRelevant: (path: string) => boolean,
  maxFileBytes = 512 * 1024,
): AsyncGenerator<SourceFile & { skipped?: 'too-large' }> {
  const zip = await JSZip.loadAsync(data);
  const entries = Object.values(zip.files).filter((f) => !f.dir);
  // Strip a single top-level folder (GitHub "Download ZIP" archives have one).
  const tops = new Set(entries.map((e) => e.name.split('/')[0]));
  const strip = tops.size === 1 && entries.every((e) => e.name.includes('/'));
  for (const e of entries) {
    const path = strip ? e.name.slice(e.name.indexOf('/') + 1) : e.name;
    if (!isRelevant(path)) {
      yield { path, content: '' };
      continue;
    }
    const size = (e as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    if (size > maxFileBytes) {
      yield { path, content: 'x'.repeat(maxFileBytes + 1), skipped: 'too-large' };
      continue;
    }
    yield { path, content: await e.async('string') };
  }
}

export const PASTE_LANGUAGES: { label: string; file: string }[] = [
  { label: 'Python', file: 'snippet.py' },
  { label: 'JavaScript', file: 'snippet.js' },
  { label: 'TypeScript', file: 'snippet.ts' },
  { label: 'Java', file: 'Snippet.java' },
  { label: 'Go', file: 'snippet.go' },
  { label: 'Kotlin', file: 'Snippet.kt' },
  { label: 'C / C++', file: 'snippet.c' },
  { label: 'C#', file: 'Snippet.cs' },
  { label: 'nginx config', file: 'nginx.conf' },
  { label: 'Apache config', file: 'httpd.conf' },
  { label: 'Dockerfile', file: 'Dockerfile' },
  { label: 'Terraform', file: 'main.tf' },
  { label: 'Kubernetes YAML', file: 'manifest.yaml' },
  { label: 'PEM key / certificate', file: 'pasted.pem' },
  { label: 'package.json', file: 'package.json' },
  { label: 'requirements.txt', file: 'requirements.txt' },
];
