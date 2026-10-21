---
id: node-tls-pq
title: 'Node.js: allow X25519MLKEM768 in TLS (Node ≥ 24.5 / OpenSSL 3.5)'
applies: [TLS, ECDH]
verified: 2026-10-21
---

## Why

`ecdhCurve` lists without a hybrid group, or `maxVersion: 'TLSv1.2'`, force classical key exchange on servers and clients.

## Replacement

Run Node.js ≥ 24.5 (or ≥ 22.20), which bundles OpenSSL 3.5. Either drop `ecdhCurve` to use the defaults, or list the hybrid first.

## Before

```javascript
https.createServer({ key, cert, ecdhCurve: 'prime256v1', minVersion: 'TLSv1' }, app);
```

## After

```javascript
https.createServer({ key, cert, ecdhCurve: 'X25519MLKEM768:X25519:prime256v1', minVersion: 'TLSv1.2' }, app);
// check: process.versions.openssl >= '3.5'
```

## Caveats

- On Node.js built against a system OpenSSL < 3.5 the group name is rejected.

## References

- https://nodejs.org/api/tls.html
- https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/
