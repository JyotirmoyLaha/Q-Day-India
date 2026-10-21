---
id: python-pqc
title: 'Python: post-quantum options (cryptography ≥ 48, liboqs-python)'
applies: [RSA, ECC, DSA, Ed25519, X25519]
verified: 2026-10-21
---

## Why

PyCryptodome, python-rsa, python-ecdsa, paramiko keys and the classical parts of `cryptography` are breakable by a future quantum computer.

## Replacement

- **pyca/cryptography ≥ 48**: `cryptography.hazmat.primitives.asymmetric.mlkem` (ML-KEM-768) and `.mldsa` (ML-DSA-65).
- **liboqs-python** (Open Quantum Safe): broad algorithm coverage for prototypes; check its own production guidance.

## Before

```python
from Crypto.PublicKey import RSA
key = RSA.generate(2048)
```

## After

```python
from cryptography.hazmat.primitives.asymmetric import mldsa, mlkem

kem_key = mlkem.MLKEM768PrivateKey.generate()
sig_key = mldsa.MLDSA65PrivateKey.generate()
```

## Caveats

- Not drop-in: sizes and APIs differ (KEM instead of encrypt; 3.3 KB signatures).
- SLH-DSA is not in cryptography 48.

## References

- https://blog.trailofbits.com/2026/06/30/shipping-post-quantum-cryptography-to-python/
- https://github.com/open-quantum-safe/liboqs-python
