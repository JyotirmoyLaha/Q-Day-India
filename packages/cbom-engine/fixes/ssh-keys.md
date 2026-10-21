---
id: ssh-keys
title: 'SSH: post-quantum key exchange is already the default; keys are still classical'
applies: [RSA, ECDSA, Ed25519, DSA]
verified: 2026-10-21
---

## Why

SSH host and user keys (RSA, ECDSA, Ed25519) are classical signatures. Since OpenSSH 10.0, the default key exchange is the hybrid `mlkem768x25519-sha256`. Recorded SSH sessions are protected if both ends are recent.

## Replacement

- Upgrade OpenSSH on clients and servers (≥ 10.0), and don't pin `KexAlgorithms` to classical-only lists.
- Prefer Ed25519 keys over RSA/DSA today (DSA is disabled in modern OpenSSH).
- Post-quantum SSH signatures are still being standardised. Keep key rotation automated.

## Before

```text
KexAlgorithms curve25519-sha256,ecdh-sha2-nistp256
ssh-keygen -t rsa -b 2048
```

## After

```text
KexAlgorithms mlkem768x25519-sha256,sntrup761x25519-sha512,curve25519-sha256
ssh-keygen -t ed25519
```

## Caveats

- Paramiko and other SSH libraries may lag behind OpenSSH. Check their key-exchange support.

## References

- https://www.openssh.com/txt/release-10.0
