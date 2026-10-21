'use client';

import { useState } from 'react';
import { copyText } from '@/lib/clipboard';
import { Icon } from './Icon';

/** A code snippet with a copy-to-clipboard button. */
export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    setState((await copyText(code)) ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 1800);
  }
  return (
    <div className="relative mt-2">
      <pre className="overflow-x-auto rounded-xl border border-line bg-subtle p-3 pr-20 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={label ? `Copy: ${label}` : 'Copy code'}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-line bg-card px-2 py-1 text-xs font-medium text-muted hover:border-accent hover:text-fg"
      >
        <Icon name={state === 'copied' ? 'check' : 'copy'} className="h-3.5 w-3.5" />
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Select & copy' : 'Copy'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied'
          ? 'Copied to clipboard'
          : state === 'failed'
            ? 'Copy failed; select the text manually'
            : ''}
      </span>
    </div>
  );
}
