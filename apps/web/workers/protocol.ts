// Messages between the /code page and quantumbom.worker.ts.
import type { Finding, ScanReport } from '@qday/cbom-engine';

export type ScanInput =
  | { kind: 'github'; url: string; token?: string }
  | { kind: 'zip'; name: string; data: ArrayBuffer }
  | { kind: 'paste'; name: string; content: string };

export type ScanRequest = { type: 'scan'; input: ScanInput } | { type: 'cancel' };

export type WorkerMessage =
  | { type: 'status'; message: string }
  | { type: 'progress'; filesDone: number; filesTotal?: number; findings: number; current?: string }
  | { type: 'findings'; findings: Finding[] }
  | { type: 'done'; report: ScanReport }
  | { type: 'error'; message: string };
