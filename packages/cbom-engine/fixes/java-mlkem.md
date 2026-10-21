---
id: java-mlkem
title: 'Java: ML-KEM and ML-DSA in the JDK (JDK 24+), hybrid TLS in JDK 27'
applies: [RSA, EC, DH, DSA, Ed25519, X25519]
verified: 2026-10-21
---

## Why

`KeyPairGenerator`, `KeyAgreement`, `Signature` and `Cipher` with RSA, EC, DH, DSA or EdDSA are classical and breakable by a future quantum computer.

## Replacement

JDK 24 added ML-KEM (JEP 496) and ML-DSA (JEP 497) to the standard providers. JDK 27 enables X25519MLKEM768 in TLS by default (JEP 527). On older JDKs use BouncyCastle ≥ 1.79.

## Before

```java
KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
kpg.initialize(2048);
Cipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
```

## After

```java
KeyPairGenerator g = KeyPairGenerator.getInstance("ML-KEM");
g.initialize(NamedParameterSpec.ML_KEM_768);
KeyPair kp = g.generateKeyPair();

KEM kem = KEM.getInstance("ML-KEM");
KEM.Encapsulated enc = kem.newEncapsulator(kp.getPublic()).encapsulate();
SecretKey shared = enc.key();               // send enc.encapsulation() to the peer

Signature s = Signature.getInstance("ML-DSA"); // keys from KeyPairGenerator.getInstance("ML-DSA")
```

## Caveats

- ML-KEM gives you a shared secret (KEM), not RSA-style encryption of arbitrary data.
- For TLS, upgrading to JDK 27 is enough. Remove any `jdk.tls.namedGroups` setting that omits the hybrid.

## References

- https://openjdk.org/jeps/496
- https://openjdk.org/jeps/497
- https://openjdk.org/jeps/527
