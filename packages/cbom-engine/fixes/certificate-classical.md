---
id: certificate-classical
title: 'Certificates: classical today — inventory them and keep issuance automated'
applies: [X.509]
verified: 2026-10-21
---

## Why

Every certificate in the public WebPKI is still RSA or ECDSA; public CAs and browsers do not issue or accept ML-DSA certificates yet. Private PKIs (internal mTLS, IoT, code signing) can already experiment with ML-DSA using OpenSSL 3.5 or BouncyCastle.

## Replacement

- Keep a CBOM of certificates (this report) with expiry dates.
- Automate issuance and renewal (ACME / your CA's API) so swapping algorithms later is a configuration change.
- For private PKIs, pilot ML-DSA or composite certificates where both ends are under your control.
- Replace SHA-1-signed or < 2048-bit RSA certificates now. That is a classical issue.

## Before

```text
Manually issued RSA-2048 certificate, renewed by hand every year
```

## After

```text
ACME-automated ECDSA P-256 certificate, 90-day lifetime, algorithm set in one config value
```

## Caveats

- Don't deploy experimental PQ certificates on public endpoints. Browsers will reject them.

## References

- https://csrc.nist.gov/pubs/fips/204/final
