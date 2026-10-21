---
id: go-tls-pq
title: 'Go: keep X25519MLKEM768 in tls.Config (default since Go 1.24)'
applies: [TLS, ECDH]
verified: 2026-10-21
---

## Why

Since Go 1.24, `crypto/tls` offers X25519MLKEM768 by default; Go 1.26 added SecP256r1MLKEM768 and SecP384r1MLKEM1024. A `CurvePreferences` list without them, a `MaxVersion` below TLS 1.3, or a toolchain older than 1.24 turns post-quantum key exchange off.

## Replacement

Delete `CurvePreferences` (best), or include the hybrid. Build with Go ≥ 1.24.

## Before

```go
cfg := &tls.Config{
    MinVersion:       tls.VersionTLS12,
    CurvePreferences: []tls.CurveID{tls.CurveP256, tls.X25519},
}
```

## After

```go
cfg := &tls.Config{
    MinVersion: tls.VersionTLS12,
    // CurvePreferences omitted: Go ≥ 1.24 offers X25519MLKEM768 first.
    // If you must set it: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256}
}
```

## Caveats

- `GODEBUG=tlsmlkem=0` also disables it. Check your deployment environment.

## References

- https://github.com/golang/go/issues/69985
- https://pkg.go.dev/crypto/tls#Config
