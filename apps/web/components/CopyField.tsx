'use client';

import { useState } from 'react';
import { copyText } from '@/lib/clipboard';
import { Icon } from './Icon';

/** A read-only code block with a labelled copy button. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    setState((await copyText(value)) ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 1800);
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-0.5 text-xs font-medium hover:border-accent"
        >
          <Icon name={state === 'copied' ? 'check' : 'copy'} className="h-3.5 w-3.5" />
          {state === 'copied' ? 'Copied' : state === 'failed' ? 'Select & copy' : 'Copy'}
        </button>
      </div>
      <pre className="mt-1 overflow-x-auto rounded-xl border border-line bg-subtle p-3 font-mono text-xs">
        <code>{value}</code>
      </pre>
    </div>
  );
}
