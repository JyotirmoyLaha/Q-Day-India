'use client';

import { useState } from 'react';

/** A read-only code block with a copy button. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-line px-2 py-0.5 text-xs hover:border-accent"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-subtle p-3 font-mono text-xs">
        <code>{value}</code>
      </pre>
    </div>
  );
}
