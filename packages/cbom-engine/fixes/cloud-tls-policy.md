---
id: cloud-tls-policy
title: 'Cloud load balancers: pick a post-quantum TLS policy'
applies: [TLS]
verified: 2026-10-21
---

## Why

Managed load balancers terminate TLS with the policy you name. Older AWS ELB policies (e.g. `ELBSecurityPolicy-2016-08`) still allow TLS 1.0/1.1 and offer no post-quantum groups. Minimum-version settings of `1.0` / `1.1` on Azure, GCP or CloudFront keep legacy protocols alive.

## Replacement

- **AWS ALB/NLB**: `ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09` (or the FIPS variant `ELBSecurityPolicy-TLS13-1-2-FIPS-PQ-2025-09`). These offer X25519MLKEM768, SecP256r1MLKEM768 and SecP384r1MLKEM1024.
- **CloudFront**: `minimum_protocol_version = "TLSv1.2_2021"`.
- **Azure / GCP**: minimum TLS version 1.2.

## Before

```hcl
resource "aws_lb_listener" "https" {
  ssl_policy = "ELBSecurityPolicy-2016-08"
}
```

## After

```hcl
resource "aws_lb_listener" "https" {
  ssl_policy = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"
}
```

## Caveats

- Check your provider's current policy table. Names are dated and new ones appear over time.

## References

- https://docs.aws.amazon.com/elasticloadbalancing/latest/application/describe-ssl-policies.html
