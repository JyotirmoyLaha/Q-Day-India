---
id: ecdh-to-hybrid
title: Move ECDH / DH / X25519 key agreement to a hybrid with ML-KEM
applies: [ECDH, DH, X25519, X448]
verified: 2026-10-21
---

## Why

Elliptic-curve and finite-field Diffie-Hellman are broken by Shor's algorithm. Recorded key exchanges can be replayed through a quantum computer later to recover session keys.

## Replacement

Combine the classical exchange with ML-KEM-768 and derive the session key from both secrets (the X25519MLKEM768 construction of RFC 10024). Inside TLS this is automatic with OpenSSL ≥ 3.5, Go ≥ 1.24, Node.js ≥ 24.5 or JDK 27. For custom protocols, add an ML-KEM encapsulation next to the X25519 exchange.

## Before

```text
secret = X25519(my_private, peer_public)
key    = HKDF(secret)
```

## After

```text
ss_classical = X25519(my_private, peer_public)
ss_pq, ct    = ML-KEM-768.Encapsulate(peer_mlkem_public)   # send ct
key          = HKDF(ss_pq || ss_classical, info="my-protocol v2")
```

## Caveats

- Keep the classical half during the transition: the hybrid is at least as strong as either part.
- Version your protocol so old and new peers can negotiate.

## References

- https://www.rfc-editor.org/info/rfc10024
- https://csrc.nist.gov/pubs/fips/203/final
