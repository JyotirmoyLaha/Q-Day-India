---
id: signatures-to-mldsa
title: Plan the move from RSA / ECDSA / EdDSA signatures to ML-DSA
applies: [RSA, ECDSA, ECC, Ed25519, DSA]
verified: 2026-10-21
---

## Why

Classical signatures will be forgeable once a cryptographically relevant quantum computer exists. Unlike key exchange, signatures are not exposed to harvest-now-decrypt-later. They matter most for long-lived trust: firmware and code signing, document signatures and root keys.

## Replacement

ML-DSA (FIPS 204), e.g. ML-DSA-65; SLH-DSA (FIPS 205) for very long-lived roots. Libraries with ML-DSA today: OpenSSL 3.5, Go 1.27 (`crypto/mldsa`), Node.js 24 (`ml-dsa-65` key type), JDK 24+ (`Signature.getInstance("ML-DSA")`), pyca/cryptography ≥ 48, BouncyCastle ≥ 1.79. Right now the most valuable step is **crypto-agility**: read the algorithm from configuration, in one place, so you can switch without a code hunt.

## Before

```python
signature = private_key.sign(data, ec.ECDSA(hashes.SHA256()))
```

## After

```python
# pip install "cryptography>=48"
from cryptography.hazmat.primitives.asymmetric import mldsa

sk = mldsa.MLDSA65PrivateKey.generate()
sig = sk.sign(data)
sk.public_key().verify(sig, data)
```

## Caveats

- ML-DSA-65 signatures are 3,309 bytes (Ed25519: 64). Check size limits in headers, tokens, databases and QR codes.
- Public web certificates cannot use ML-DSA yet; this applies to your own signing systems first.

## References

- https://csrc.nist.gov/pubs/fips/204/final
- https://csrc.nist.gov/pubs/fips/205/final
