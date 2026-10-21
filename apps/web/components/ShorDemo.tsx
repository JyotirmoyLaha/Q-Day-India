'use client';

import { useState } from 'react';

const N = 15;
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const modpow = (a: number, e: number, m: number) => {
  let r = 1;
  for (let i = 0; i < e; i++) r = (r * a) % m;
  return r;
};

/** The classical skeleton of Shor's algorithm for N = 15; the quantum part finds the period r. */
export function ShorDemo() {
  const [a, setA] = useState(7);
  const seq = Array.from({ length: 8 }, (_, x) => modpow(a, x, N));
  const r = seq.slice(1).indexOf(1) + 1;
  const half = r % 2 === 0 ? modpow(a, r / 2, N) : null;
  const f1 = half !== null ? gcd(half - 1, N) : null;
  const f2 = half !== null ? gcd(half + 1, N) : null;
  const works = half !== null && half !== N - 1 && f1! > 1 && f2! > 1;

  return (
    <div className="card p-5">
      <label htmlFor="shor-a" className="text-sm font-medium">
        Pick a number a (coprime to 15):
      </label>
      <select
        id="shor-a"
        value={a}
        onChange={(e) => setA(Number(e.target.value))}
        className="ml-2 rounded border border-line bg-card px-2 py-1"
      >
        {[2, 4, 7, 8, 11, 13, 14].map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <div className="mt-4 overflow-x-auto">
        <table className="text-sm">
          <caption className="sr-only">Powers of {a} modulo 15</caption>
          <tbody>
            <tr>
              <th scope="row" className="pr-3 text-left font-medium text-muted">
                x
              </th>
              {seq.map((_, x) => (
                <td key={x} className="w-10 text-center font-mono">
                  {x}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="pr-3 text-left font-medium text-muted">
                {a}^x mod 15
              </th>
              {seq.map((v, x) => (
                <td
                  key={x}
                  className={`w-10 text-center font-mono ${v === 1 && x > 0 ? 'rounded bg-accent-soft font-bold' : ''}`}
                >
                  {v}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm" aria-live="polite">
        The sequence repeats with <strong>period r = {r}</strong>. A quantum computer finds this period
        exponentially faster than any known classical method, for numbers with hundreds of digits.{' '}
        {works ? (
          <>
            Then gcd({a}^{r / 2} − 1, 15) = <strong>{f1}</strong> and gcd({a}^{r / 2} + 1, 15) ={' '}
            <strong>{f2}</strong>: the factors of 15. RSA&apos;s security rests on that factoring being hard.
          </>
        ) : (
          <>
            For this a the trick doesn&apos;t yield a factor ({r % 2 ? 'r is odd' : `a^(r/2) ≡ −1`});
            Shor&apos;s algorithm simply tries another a.
          </>
        )}
      </p>
    </div>
  );
}
