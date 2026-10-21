---
id: deprecated-library
title: Replace unmaintained cryptography libraries
applies: [library]
verified: 2026-10-21
---

## Why

Unmaintained libraries (e.g. PyCrypto, last released 2013; crypto-js, discontinued in 2023) receive no security fixes and will never gain post-quantum algorithms.

## Replacement

- PyCrypto → `cryptography` (≥ 48 for ML-KEM/ML-DSA) or PyCryptodome for legacy APIs.
- crypto-js → the platform's WebCrypto / `node:crypto`.

## Before

```text
pycrypto==2.6.1
```

## After

```text
cryptography>=48
```

## Caveats

- APIs differ. Budget time for tests around every call site.

## References

- https://cryptography.io/
