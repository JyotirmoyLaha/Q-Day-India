---
id: dotnet-pqc
title: '.NET: MLKem / MLDsa classes (.NET 10)'
applies: [RSA, ECDsa, ECDiffieHellman, DSA]
verified: 2026-10-21
---

## Why

`RSA.Create()`, `ECDsa.Create()` and `ECDiffieHellman.Create()` are classical algorithms.

## Replacement

.NET 10 added `System.Security.Cryptography.MLKem`, `MLDsa` and `SlhDsa`. They need platform support: OpenSSL ≥ 3.5 on Linux, or a Windows build with PQC in CNG. Check `MLKem.IsSupported` at runtime.

## Before

```csharp
using var rsa = RSA.Create(2048);
```

## After

```csharp
if (MLKem.IsSupported)
{
    using var kem = MLKem.GenerateKey(MLKemAlgorithm.MLKem768);
}
```

## Caveats

- Keep the classical path behind a feature flag until all target platforms support the new classes.

## References

- https://learn.microsoft.com/dotnet/standard/security/cryptography-model
