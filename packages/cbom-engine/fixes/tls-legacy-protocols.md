---
id: tls-legacy-protocols
title: Turn off SSLv3 / TLS 1.0 / TLS 1.1
applies: [TLS 1.0, TLS 1.1, SSLv3]
verified: 2026-10-21
---

## Why

TLS 1.0 and 1.1 were deprecated by RFC 8996 (2021). They cannot carry post-quantum key exchange, and they rely on outdated constructions (SHA-1/MD5 handshake hashes, CBC padding issues).

## Replacement

Allow TLS 1.2 and 1.3 only; prefer 1.3, the only version with post-quantum hybrid groups.

## Before

```text
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;      # nginx
minVersion: 'TLSv1'                         # Node.js
MinVersion: tls.VersionTLS10                # Go
```

## After

```text
ssl_protocols TLSv1.3 TLSv1.2;
minVersion: 'TLSv1.2'
MinVersion: tls.VersionTLS12
```

## Caveats

- Very old clients (Android ≤ 4.3, Windows XP-era software) will no longer connect. Check your access logs first.

## References

- https://www.rfc-editor.org/rfc/rfc8996
