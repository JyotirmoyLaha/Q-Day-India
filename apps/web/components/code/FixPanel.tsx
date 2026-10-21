import type { Fix } from '@qday/cbom-engine';

/** Renders one fix guide: why, replacement, before/after and caveats. */
export function FixPanel({ fix }: { fix: Fix }) {
  return (
    <div className="mt-3 rounded-lg border border-accent/60 bg-accent-soft/40 p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold">{fix.title}</h4>
        <span className="text-xs text-muted">Last verified {fix.verified}</span>
      </div>
      <Para label="Why" text={fix.why} />
      <Para label="Replacement" text={fix.replacement} />
      {(fix.before || fix.after) && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {fix.before && <Code label="Before" lang={fix.before.lang} code={fix.before.code} />}
          {fix.after && <Code label="After" lang={fix.after.lang} code={fix.after.code} />}
        </div>
      )}
      <Para label="Caveats" text={fix.caveats} />
      {fix.references.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs">
          {fix.references.map((r) => (
            <li key={r}>
              <a href={r} className="break-all text-accent underline" rel="noreferrer">
                {r}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Para({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-0.5 whitespace-pre-line">
        {text
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .trim()}
      </div>
    </div>
  );
}

function Code({ label, lang, code }: { label: string; lang: string; code: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label} <span className="font-normal normal-case">({lang})</span>
      </p>
      <pre className="mt-1 overflow-x-auto rounded-md border border-line bg-card p-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
