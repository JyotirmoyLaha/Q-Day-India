---
id: tls-nginx-pq
title: 'nginx: offer X25519MLKEM768 (needs OpenSSL ≥ 3.5)'
applies: [TLS]
verified: 2026-10-21
---

## Why

An `ssl_ecdh_curve` list without a post-quantum hybrid, or `ssl_protocols` without TLSv1.3, means every connection uses classical key exchange. That traffic is exposed to harvest-now-decrypt-later.

## Replacement

Build or install nginx linked against OpenSSL 3.5 or newer (`nginx -V` shows the OpenSSL version), enable TLS 1.3 and put the hybrid group first.

## Before

```nginx
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_ecdh_curve prime256v1;
```

## After

```nginx
ssl_protocols TLSv1.3 TLSv1.2;
ssl_ecdh_curve X25519MLKEM768:X25519:prime256v1:secp384r1;
```

## Caveats

- With OpenSSL < 3.5 nginx refuses to start with an unknown group name. Upgrade the OpenSSL package or base image first.
- Keep classical groups after the hybrid so older clients can still connect.
- Verify with `openssl s_client -groups X25519MLKEM768 -connect host:443` or the Q-Day India site checker.

## References

- https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_ecdh_curve
- https://github.com/openssl/openssl/releases
