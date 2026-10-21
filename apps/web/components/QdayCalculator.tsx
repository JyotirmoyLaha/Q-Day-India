'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CRQC_YEARS, migrationYearsFromFindings, mosca, moscaHeadline } from '@/lib/mosca';
import { SHELF_DEFAULTS } from '@/lib/grading';
import { SECTORS, type Sector } from '@/lib/types';
import { sectorLabel } from '@/lib/i18n';

const THIS_YEAR = 2026;

export function QdayCalculator() {
  const [sector, setSector] = useState<Sector | ''>('');
  const [x, setX] = useState(10);
  const [y, setY] = useState(5);
  const [z, setZ] = useState(DEFAULT_CRQC_YEARS);
  const [yNote, setYNote] = useState('');

  // Prefill from ?sector=…&findings=…&x=&y=&z= (links from /org and /site).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get('sector') as Sector | null;
    const num = (k: string) =>
      p.get(k) !== null && Number.isFinite(Number(p.get(k))) ? Number(p.get(k)) : undefined;
    /* eslint-disable react-hooks/set-state-in-effect -- reading the query string on mount */
    if (s && s in SHELF_DEFAULTS) {
      setSector(s);
      setX(SHELF_DEFAULTS[s]);
    }
    const findings = num('findings');
    if (findings !== undefined) {
      setY(migrationYearsFromFindings(findings));
      setYNote(
        `Estimated from ${findings} quantum-relevant findings in your code (heuristic: 1 + 0.75 × log₂(1 + findings) years).`,
      );
    }
    const [qx, qy, qz] = [num('x'), num('y'), num('z')];
    if (qx !== undefined) setX(qx);
    if (qy !== undefined) setY(qy);
    if (qz !== undefined) setZ(qz);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const r = mosca(x, y, z);
  const total = Math.max(x + y, z, 1) + 2;
  const pctOf = (v: number) => `${(100 * v) / total}%`;

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form
        className="space-y-6 rounded-xl border border-line bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Mosca inputs"
      >
        <label className="block text-sm">
          <span className="font-medium">Sector preset</span>
          <select
            className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2"
            value={sector}
            onChange={(e) => {
              const s = e.target.value as Sector | '';
              setSector(s);
              if (s) setX(SHELF_DEFAULTS[s]);
            }}
          >
            <option value="">Custom</option>
            {SECTORS.filter((s) => s !== 'other').map((s) => (
              <option key={s} value={s}>
                {sectorLabel(s)} ({SHELF_DEFAULTS[s]} years)
              </option>
            ))}
          </select>
        </label>
        <Slider
          id="x"
          label="X — how long your data must stay secret"
          value={x}
          min={0}
          max={50}
          onChange={setX}
          help="Shelf life of the data: e.g. health records 25+ years, banking 10, session tokens < 1."
        />
        <Slider
          id="y"
          label="Y — how long your migration will take"
          value={y}
          min={0}
          max={20}
          onChange={(v) => {
            setY(v);
            setYNote('');
          }}
          help={
            yNote ||
            'Inventory, testing, vendor upgrades, rollout. Large organisations typically need 5–10 years.'
          }
        />
        <Slider
          id="z"
          label="Z — years until a cryptographically relevant quantum computer"
          value={z}
          min={1}
          max={40}
          onChange={setZ}
          help="Nobody knows. Expert surveys put meaningful probability within 10–15 years; pick your own risk appetite."
        />
      </form>

      <section aria-live="polite" aria-labelledby="mosca-result" className="space-y-6">
        <div
          className={`rounded-xl border-2 p-6 ${r.late ? 'border-exposed bg-exposed-soft' : 'border-accent bg-accent-soft'}`}
        >
          <p className="text-sm uppercase tracking-wide text-muted">
            Mosca&apos;s inequality: X + Y {r.late ? '>' : '≤'} Z
          </p>
          <h2 id="mosca-result" className="mt-1 font-serif text-5xl font-semibold tracking-tight">
            {moscaHeadline(r)}
          </h2>
          <p className="mt-3 max-w-2xl">
            {r.late
              ? `Data you encrypt today with classical key exchange could still need protection ${r.years} ${r.years === 1 ? 'year' : 'years'} after a quantum computer may exist, even if you start migrating now. Harvest-now-decrypt-later applies: start with key exchange.`
              : `If you start now and finish in ${y} years, your data's secrecy period ends before your quantum-computer estimate. Margins shrink every year you wait.`}
          </p>
        </div>

        <figure className="rounded-xl border border-line bg-card p-5">
          <div className="relative h-28" aria-hidden="true">
            <div className="absolute left-0 top-2 flex h-9 w-full overflow-hidden rounded">
              <div
                className="flex items-center justify-center bg-info text-xs font-medium text-bg"
                style={{ width: pctOf(y) }}
              >
                {y > 1 ? `migrate ${y}y` : ''}
              </div>
              <div
                className="flex items-center justify-center bg-exposed text-xs font-medium text-bg"
                style={{ width: pctOf(x) }}
              >
                {x > 1 ? `keep secret ${x}y` : ''}
              </div>
            </div>
            <div
              className="absolute top-0 h-16 border-l-2 border-dashed border-fg"
              style={{ left: pctOf(z) }}
            >
              <span className="ml-1 whitespace-nowrap text-xs font-medium">Q-Day ≈ {THIS_YEAR + z}</span>
            </div>
            <div className="absolute bottom-0 left-0 flex w-full justify-between text-xs text-muted">
              <span>{THIS_YEAR}</span>
              <span>{THIS_YEAR + total}</span>
            </div>
          </div>
          <figcaption className="mt-3 text-sm text-muted">
            Timeline from {THIS_YEAR}: migration ends in {THIS_YEAR + y}, the data must stay secret until{' '}
            {THIS_YEAR + y + x}, and a quantum computer is assumed in {THIS_YEAR + z}.
          </figcaption>
        </figure>
      </section>
    </div>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  onChange,
  help,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  help: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-medium">
        <span>{label}</span>
        <output htmlFor={id} className="font-serif text-2xl tabular-nums">
          {value}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--accent)]"
        aria-describedby={`${id}-help`}
        aria-valuetext={`${value} years`}
      />
      <p id={`${id}-help`} className="mt-1 text-xs text-muted">
        {help}
      </p>
    </div>
  );
}
