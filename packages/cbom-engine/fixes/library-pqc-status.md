---
id: library-pqc-status
title: Check the library's post-quantum roadmap
applies: [library]
verified: 2026-10-21
---

## Why

This dependency provides classical public-key cryptography. Listing it in the CBOM shows where migration work will land. The code-level findings show the actual call sites.

## Replacement

Known post-quantum support (checked on the verification date):

- pyca/cryptography ≥ 48: ML-KEM, ML-DSA.
- BouncyCastle Java ≥ 1.79: ML-KEM, ML-DSA, SLH-DSA.
- JDK ≥ 24: ML-KEM, ML-DSA. JDK 27: hybrid TLS by default.
- Go ≥ 1.24: crypto/mlkem and PQ TLS by default. Go ≥ 1.27: crypto/mldsa.
- Node.js 24: ml-kem / ml-dsa key types; ≥ 24.5 bundles OpenSSL 3.5.
- JOSE/JWT libraries: ML-DSA support is still emerging. Keep the algorithm configurable.

## Caveats

- Library presence alone is low-confidence: it does not prove the classical algorithms are used.

## References

- https://csrc.nist.gov/projects/post-quantum-cryptography
