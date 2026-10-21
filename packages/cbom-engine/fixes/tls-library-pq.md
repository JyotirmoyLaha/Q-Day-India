---
id: tls-library-pq
title: Don't pin TLS key exchange to a classical curve
applies: [TLS, ECDH]
verified: 2026-10-21
---

## Why

Pinning the key-exchange group (e.g. `ctx.set_ecdh_curve("prime256v1")` in Python, `jdk.tls.namedGroups=secp256r1` in Java) overrides library defaults that already include X25519MLKEM768 in current versions.

## Replacement

Remove the pin and let the TLS library choose. Make sure the library is new enough: Python linked against OpenSSL ≥ 3.5 (`ssl.OPENSSL_VERSION`), JDK 27, Node.js ≥ 24.5, Go ≥ 1.24. If you must restrict groups, put the hybrid first.

## Before

```python
ctx = ssl.create_default_context()
ctx.set_ecdh_curve("prime256v1")
```

## After

```python
ctx = ssl.create_default_context()   # OpenSSL 3.5 default groups start with X25519MLKEM768
ctx.minimum_version = ssl.TLSVersion.TLSv1_2
```

## Caveats

- Python's `set_ecdh_curve` accepts a single name only, so the safest choice is not to call it.

## References

- https://docs.python.org/3/library/ssl.html
- https://openjdk.org/jeps/527
