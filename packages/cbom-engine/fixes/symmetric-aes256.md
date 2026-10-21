---
id: symmetric-aes256
title: Use AES-256 instead of AES-128 for long-lived data
applies: [AES-128]
verified: 2026-10-21
---

## Why

Grover's algorithm gives a quadratic speed-up against brute force, reducing AES-128 to roughly 64-bit security against a quantum attacker in theory. The practical risk is low, but data that must stay secret for decades should use 256-bit keys.

## Replacement

AES-256-GCM (or ChaCha20-Poly1305).

## Before

```javascript
crypto.createCipheriv('aes-128-gcm', key16, iv);
```

## After

```javascript
crypto.createCipheriv('aes-256-gcm', key32, iv); // 32-byte key
```

## Caveats

- Low priority compared with public-key migration. Grover is hard to parallelise and needs very long-running quantum computations.

## References

- https://csrc.nist.gov/projects/post-quantum-cryptography/faqs
