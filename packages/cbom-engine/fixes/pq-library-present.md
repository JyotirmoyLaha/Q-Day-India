---
id: pq-library-present
title: Post-quantum library detected
applies: [ML-KEM, ML-DSA]
verified: 2026-10-21
---

## Why

This dependency implements post-quantum algorithms (ML-KEM / ML-DSA / SLH-DSA). That's good news: it is listed in the CBOM as a quantum-safe asset.

## Replacement

No change needed. Keep it updated and make sure it is actually used where classical algorithms remain.

## Caveats

- Prefer implementations of the final FIPS 203/204/205 standards over pre-standard (Kyber/Dilithium round-3) variants.

## References

- https://csrc.nist.gov/projects/post-quantum-cryptography
