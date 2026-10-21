---
id: c-openssl-pq
title: 'C/C++: use OpenSSL 3.5 EVP APIs for ML-KEM / ML-DSA'
applies: [RSA, EC, DH, Ed25519, X25519, MD5, SHA-1]
verified: 2026-10-21
---

## Why

Low-level calls like `RSA_generate_key_ex`, `EC_KEY_new_by_curve_name` or `DH_generate_key` hard-wire classical algorithms, and many of these APIs are deprecated in OpenSSL 3.

## Replacement

Use the algorithm-agnostic EVP interface. With OpenSSL ≥ 3.5, ML-KEM and ML-DSA are available by name, so the algorithm becomes a string you can configure.

## Before

```c
RSA *rsa = RSA_new();
RSA_generate_key_ex(rsa, 2048, e, NULL);
```

## After

```c
EVP_PKEY *kem = EVP_PKEY_Q_keygen(NULL, NULL, "ML-KEM-768");
EVP_PKEY *sig = EVP_PKEY_Q_keygen(NULL, NULL, "ML-DSA-65");
/* encapsulate with EVP_PKEY_encapsulate_init / EVP_PKEY_encapsulate */
```

## Caveats

- For TLS, OpenSSL 3.5 already offers X25519MLKEM768 by default. Don't override the groups list.

## References

- https://docs.openssl.org/3.5/man7/EVP_KEM-ML-KEM/
- https://docs.openssl.org/3.5/man7/EVP_SIGNATURE-ML-DSA/
