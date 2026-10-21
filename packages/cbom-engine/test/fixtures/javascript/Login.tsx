// Fixture: TSX component with crypto in an event handler.
import { useState } from 'react';

export function Login() {
  const [sig, setSig] = useState<ArrayBuffer | null>(null);
  async function onSubmit() {
    const pair = await window.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']); // expect: js-webcrypto-algorithm
    setSig(await window.crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pair.privateKey, new Uint8Array([1]))); // expect: js-webcrypto-algorithm
  }
  return <button onClick={onSubmit}>Sign in with RSA (label only)</button>;
}
