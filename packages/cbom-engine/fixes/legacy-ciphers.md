---
id: legacy-ciphers
title: Replace DES / 3DES / RC4 / Blowfish with AES-256-GCM
applies: [DES, 3DES, RC4, RC2, Blowfish]
verified: 2026-10-21
---

## Why

These ciphers are already weak against classical attacks: small keys or blocks, or biased keystreams (RC4). NIST withdrew 3DES for encryption.

## Replacement

AES-256-GCM or ChaCha20-Poly1305 (authenticated encryption).

## Before

```java
Cipher c = Cipher.getInstance("DESede/CBC/PKCS5Padding");
```

## After

```java
Cipher c = Cipher.getInstance("AES/GCM/NoPadding"); // 256-bit key, unique 12-byte IV per message
```

## Caveats

- Re-encrypt stored data; keep the old cipher only for one-way decryption during migration.

## References

- https://csrc.nist.gov/pubs/sp/800/131/a/r2/final
