---
id: tls-openssl-cnf-pq
title: 'openssl.cnf: remove group lists that exclude ML-KEM hybrids'
applies: [TLS]
verified: 2026-10-21
---

## Why

A system-wide `Groups` / `Curves` setting in `openssl.cnf` overrides OpenSSL 3.5's default, which already offers X25519MLKEM768 first. A classical-only list silently disables post-quantum key exchange for every application on the host.

## Replacement

Delete the line to get the OpenSSL 3.5 defaults, or list the hybrid explicitly. Also raise `MinProtocol` to TLSv1.2.

## Before

```ini
[system_default_sect]
MinProtocol = TLSv1
Groups = P-256:X25519
```

## After

```ini
[system_default_sect]
MinProtocol = TLSv1.2
Groups = X25519MLKEM768:X25519:P-256:P-384
```

## Caveats

- Requires OpenSSL ≥ 3.5; older versions reject unknown group names.

## References

- https://docs.openssl.org/3.5/man3/SSL_CONF_cmd/
