---
id: rsa-to-mlkem
title: Replace RSA encryption / key transport with ML-KEM (hybrid)
applies: [RSA]
verified: 2026-10-21
---

## Why

RSA is broken by Shor's algorithm. Data or session keys wrapped with RSA today can be recorded and decrypted later by a quantum computer.

## Replacement

Use ML-KEM-768 (FIPS 203) to establish a shared secret, ideally as a hybrid with X25519 (X25519MLKEM768 in TLS). Then encrypt data with AES-256-GCM using a key derived from the shared secret. For TLS, simply upgrading the TLS library usually suffices: OpenSSL ≥ 3.5, Go ≥ 1.24, Node.js ≥ 24.5, JDK 27 and all major browsers negotiate X25519MLKEM768.

## Before

```text
session_key → RSA-OAEP(public_key) → send
```

## After

```text
(shared_secret, ct) = ML-KEM-768.Encapsulate(pk)   # optionally combined with X25519
key = HKDF-SHA256(shared_secret || x25519_secret)
send(ct, AES-256-GCM(key, data))
```

## Caveats

- RSA signatures need a different migration (ML-DSA). See the signatures fix.
- Larger keys and ciphertexts; protocol length fields may need changes.

## References

- https://csrc.nist.gov/pubs/fips/203/final
- https://www.rfc-editor.org/info/rfc10024
