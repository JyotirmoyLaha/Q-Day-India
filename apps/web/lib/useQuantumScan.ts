'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Finding, ScanReport } from '@qday/cbom-engine';
import type { ScanInput, ScanRequest, WorkerMessage } from '@/workers/protocol';

export type { ScanInput };

export type ScanState =
  | { phase: 'idle' }
  | {
      phase: 'running';
      status: string;
      filesDone: number;
      filesTotal?: number;
      findings: Finding[];
      current?: string;
    }
  | { phase: 'done'; report: ScanReport }
  | { phase: 'error'; message: string };

/** Runs QuantumBOM in a Web Worker and streams progress. */
export function useQuantumScan() {
  const [state, setState] = useState<ScanState>({ phase: 'idle' });
  const worker = useRef<Worker | null>(null);

  const ensureWorker = useCallback(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('../workers/quantumbom.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const m = e.data;
        setState((s) => {
          switch (m.type) {
            case 'status':
              return s.phase === 'running' ? { ...s, status: m.message } : s;
            case 'progress':
              return s.phase === 'running'
                ? {
                    ...s,
                    filesDone: m.filesDone,
                    filesTotal: m.filesTotal ?? s.filesTotal,
                    current: m.current,
                  }
                : s;
            case 'findings':
              return s.phase === 'running' ? { ...s, findings: [...s.findings, ...m.findings] } : s;
            case 'done':
              return { phase: 'done', report: m.report };
            case 'error':
              return { phase: 'error', message: m.message };
          }
        });
      };
      worker.current.onerror = (e) =>
        setState({ phase: 'error', message: e.message || 'The scanner worker failed to start.' });
    }
    return worker.current;
  }, []);

  const start = useCallback(
    (input: ScanInput) => {
      setState({ phase: 'running', status: 'Starting…', filesDone: 0, findings: [] });
      const w = ensureWorker();
      if (input.kind === 'zip') w.postMessage({ type: 'scan', input } satisfies ScanRequest, [input.data]);
      else w.postMessage({ type: 'scan', input } satisfies ScanRequest);
    },
    [ensureWorker],
  );

  const cancel = useCallback(() => {
    worker.current?.postMessage({ type: 'cancel' } satisfies ScanRequest);
    worker.current?.terminate();
    worker.current = null;
    setState({ phase: 'idle' });
  }, []);

  const showReport = useCallback((report: ScanReport) => setState({ phase: 'done', report }), []);
  const reset = useCallback(() => setState({ phase: 'idle' }), []);

  useEffect(() => () => worker.current?.terminate(), []);

  return { state, start, cancel, showReport, reset };
}
