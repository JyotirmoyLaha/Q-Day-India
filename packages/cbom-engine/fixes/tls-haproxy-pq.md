---
id: tls-haproxy-pq
title: 'HAProxy: add X25519MLKEM768 to the curves list'
applies: [TLS]
verified: 2026-10-21
---

## Why

A `curves` / `ssl-default-bind-curves` list without a post-quantum hybrid limits clients to classical key exchange.

## Replacement

Run HAProxy built with OpenSSL ≥ 3.5 (or AWS-LC), then list the hybrid first.

## Before

```haproxy
global
  ssl-default-bind-curves P-256:X25519
  ssl-default-bind-options ssl-min-ver TLSv1.0
```

## After

```haproxy
global
  ssl-default-bind-curves X25519MLKEM768:X25519:P-256
  ssl-default-bind-options ssl-min-ver TLSv1.2
```

## Caveats

- Check `haproxy -vv` for the SSL library version before deploying the new names.

## References

- https://docs.haproxy.org/
