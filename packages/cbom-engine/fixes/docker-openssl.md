---
id: docker-openssl
title: Move to a base image with OpenSSL ≥ 3.5 (or a PQ-capable runtime)
applies: [OpenSSL]
verified: 2026-10-21
---

## Why

TLS libraries older than OpenSSL 3.5 (Debian ≤ 12, Ubuntu ≤ 25.04, Alpine ≤ 3.21, CentOS) cannot negotiate X25519MLKEM768. The same applies to Go < 1.24 toolchains and Node.js < 22.20 / 24.5. Every service built on such an image talks classical TLS only.

## Replacement

Debian 13 "trixie", Ubuntu 25.10+ and Alpine 3.22+ ship OpenSSL 3.5. Node.js ≥ 24.5 and Go ≥ 1.24 bring their own PQ-capable TLS regardless of the base image.

## Before

```dockerfile
FROM python:3.12-bookworm
FROM golang:1.22
```

## After

```dockerfile
FROM python:3.13-trixie
FROM golang:1.27
```

## Caveats

- Test the upgrade: major distro jumps change other system libraries too.
- Check with `openssl version` inside the image.

## References

- https://github.com/openssl/openssl/releases
