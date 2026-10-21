---
id: node-crypto-migration
title: 'Node.js: ML-KEM and ML-DSA in node:crypto'
applies: [RSA, ECDSA, ECDH, Ed25519, X25519, DH]
verified: 2026-10-21
---

## Why

RSA, ECDSA, ECDH, Ed25519 and X25519 keys from `crypto.generateKeyPair`, WebCrypto or libraries like node-forge, elliptic and tweetnacl are breakable by a future quantum computer.

## Replacement

Recent Node.js 24 releases support `ml-kem-*` and `ml-dsa-*` key types (verified on 24.11.1), with `crypto.encapsulate` / `crypto.decapsulate` for KEMs and `crypto.sign(null, …)` for ML-DSA.

## Before

```javascript
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
```

## After

```javascript
const kem = crypto.generateKeyPairSync('ml-kem-768');
const { sharedKey, ciphertext } = crypto.encapsulate(kem.publicKey);
const same = crypto.decapsulate(kem.privateKey, ciphertext);

const sig = crypto.generateKeyPairSync('ml-dsa-65');
const signature = crypto.sign(null, data, sig.privateKey);
crypto.verify(null, data, sig.publicKey, signature);
```

## Caveats

- In the browser, WebCrypto has no ML-KEM yet. Use a vetted library such as `@noble/post-quantum`, or do key establishment server-side.
- Use a hybrid (X25519 + ML-KEM) for new protocols during the transition.

## References

- https://nodejs.org/api/crypto.html
