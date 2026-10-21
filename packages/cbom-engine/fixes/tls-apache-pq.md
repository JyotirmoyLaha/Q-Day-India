---
id: tls-apache-pq
title: 'Apache httpd: enable TLS 1.3 and the X25519MLKEM768 group'
applies: [TLS]
verified: 2026-10-21
---

## Why

`SSLOpenSSLConfCmd Curves` / `Groups` without a hybrid, or `SSLProtocol` lines that keep TLS 1.0/1.1, mean classical-only key exchange or deprecated protocols.

## Replacement

Use mod_ssl linked against OpenSSL ≥ 3.5, then configure the groups and protocols explicitly.

## Before

```apache
SSLProtocol all -SSLv3
SSLOpenSSLConfCmd Curves prime256v1
```

## After

```apache
SSLProtocol -all +TLSv1.3 +TLSv1.2
SSLOpenSSLConfCmd Groups X25519MLKEM768:X25519:prime256v1
```

## Caveats

- `all` in Apache 2.4 still includes TLS 1.0 and 1.1 unless removed explicitly.

## References

- https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslopensslconfcmd
