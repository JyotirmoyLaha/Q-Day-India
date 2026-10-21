---
id: k8s-ingress-tls
title: 'Kubernetes ingress / service mesh: TLS 1.2+ and hybrid groups'
applies: [TLS]
verified: 2026-10-21
---

## Why

Ingress controllers and meshes have their own TLS settings. Legacy protocol lists or classical-only curve settings apply to every service behind them.

## Replacement

ingress-nginx: set `ssl-protocols: "TLSv1.2 TLSv1.3"` and, with a controller image built on OpenSSL ≥ 3.5, `ssl-ecdh-curve: "X25519MLKEM768:X25519:prime256v1"`. Istio/Envoy: `minProtocolVersion: TLSV1_2`. Check your mesh's documentation for its post-quantum group support.

## Before

```yaml
data:
  ssl-protocols: "TLSv1 TLSv1.1 TLSv1.2"
  ssl-ecdh-curve: "secp384r1"
```

## After

```yaml
data:
  ssl-protocols: "TLSv1.2 TLSv1.3"
  ssl-ecdh-curve: "X25519MLKEM768:X25519:prime256v1"
```

## Caveats

- The curve name only works if the controller's OpenSSL is ≥ 3.5. Check the image's release notes.

## References

- https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/
