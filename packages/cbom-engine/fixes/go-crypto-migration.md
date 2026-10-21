---
id: go-crypto-migration
title: 'Go: crypto/mlkem (1.24+) and crypto/mldsa (1.27+)'
applies: [RSA, ECDSA, ECDH, Ed25519]
verified: 2026-10-21
---

## Why

`crypto/rsa`, `crypto/ecdsa`, `crypto/ecdh` and `crypto/ed25519` are classical and breakable by a future quantum computer.

## Replacement

The Go standard library ships ML-KEM (`crypto/mlkem`, Go 1.24+) and ML-DSA (`crypto/mldsa`, Go 1.27+). For TLS nothing is needed beyond Go ≥ 1.24.

## Before

```go
priv, _ := rsa.GenerateKey(rand.Reader, 2048)
```

## After

```go
dk, _ := mlkem.GenerateKey768()          // key establishment
sharedKey, ciphertext := dk.EncapsulationKey().Encapsulate()
_ = sharedKey; _ = ciphertext

sk, _ := mldsa.GenerateKey(mldsa.MLDSA65()) // signatures (Go 1.27+)
sig, _ := sk.Sign(nil, msg, &mldsa.Options{})
_ = sig
```

## Caveats

- Keys and signatures are much larger. ML-DSA-65 signatures are 3,309 bytes.
- For new protocols, combine ML-KEM with X25519 (hybrid) during the transition.

## References

- https://pkg.go.dev/crypto/mlkem
- https://pkg.go.dev/crypto/mldsa
