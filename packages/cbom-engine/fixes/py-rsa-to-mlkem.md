---
id: py-rsa-to-mlkem
title: 'Python: replace RSA key transport with ML-KEM (pyca/cryptography ≥ 48)'
applies: [RSA, ECDH, DH, X25519]
verified: 2026-10-21
---

## Why

RSA encryption and RSA/ECDH-based key establishment are broken by Shor's algorithm. Anything encrypted with them today can be recorded now and decrypted once a large quantum computer exists (harvest now, decrypt later).

## Replacement

Use ML-KEM-768 (FIPS 203). pyca/cryptography 48 and later ships ML-KEM and ML-DSA. During the transition, prefer a hybrid: derive the session key from both an X25519 shared secret and an ML-KEM shared secret, e.g. with HKDF over the concatenation.

## Before

```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
ct = key.public_key().encrypt(session_key, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
```

## After

```python
# pip install "cryptography>=48"
from cryptography.hazmat.primitives.asymmetric import mlkem

sk = mlkem.MLKEM768PrivateKey.generate()
pk = sk.public_key()

shared_secret, ciphertext = pk.encapsulate()   # sender
assert sk.decapsulate(ciphertext) == shared_secret  # receiver
```

## Caveats

- ML-KEM is a KEM, not public-key encryption: you get a shared secret to key a symmetric cipher (e.g. AES-256-GCM), not "encrypt this blob".
- Keys and ciphertexts are larger (ML-KEM-768 ciphertext: 1,088 bytes). Check length fields and storage columns.
- Check which backend your wheel uses (AWS-LC / OpenSSL) supports ML-KEM on your platform. If you cannot upgrade yet, liboqs-python is an alternative (see the Open Quantum Safe project).

## References

- https://blog.trailofbits.com/2026/06/30/shipping-post-quantum-cryptography-to-python/
- https://csrc.nist.gov/pubs/fips/203/final
