---
id: jwt-crypto-agility
title: 'JWT / JOSE: make the signing algorithm configurable (RS*, ES*, PS*, EdDSA)'
applies: [RSA, ECDSA, RSA-PSS, Ed25519]
verified: 2026-10-21
---

## Why

RS256, PS256, ES256 and EdDSA tokens rely on signatures that a future quantum computer can forge. Tokens are short-lived, so the practical risk is forged tokens after Q-Day, not decrypting old ones. The fix is to be ready to switch quickly.

## Replacement

1. Move the algorithm name and keys into configuration (one place, not every call site).
2. Publish keys through JWKS with `kid` so you can rotate algorithms without downtime.
3. Track the IETF JOSE work on ML-DSA (e.g. `ML-DSA-65` identifiers) and switch when your libraries support it.

## Before

```javascript
jwt.sign(payload, privateKey, { algorithm: 'RS256' });
```

## After

```javascript
// config/crypto.js — the only place that names an algorithm
export const JWT_ALG = process.env.JWT_ALG ?? 'ES256';
// usage
jwt.sign(payload, signingKey, { algorithm: JWT_ALG, keyid: currentKid });
```

## Caveats

- HS256 (HMAC) is not affected by Shor; it is not flagged.
- Always pin the accepted algorithms on verification (`algorithms: [JWT_ALG]`).

## References

- https://datatracker.ietf.org/wg/jose/documents/
