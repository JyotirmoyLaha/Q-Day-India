---
id: hash-md5-sha1
title: Replace MD5 / SHA-1 with SHA-256 or SHA-3
applies: [MD5, SHA-1]
verified: 2026-10-21
---

## Why

MD5 and SHA-1 already have practical collision attacks today. This is a classical problem, not a quantum one, but it should be fixed before any post-quantum work. SHA-256/384 and SHA-3 remain acceptable against quantum attackers.

## Replacement

SHA-256 (or SHA-384 / SHA3-256). For passwords use a password hash (Argon2id, scrypt, bcrypt), not a plain digest.

## Before

```python
import hashlib
digest = hashlib.md5(data).hexdigest()
```

## After

```python
import hashlib
digest = hashlib.sha256(data).hexdigest()
```

## Caveats

- Non-security uses (cache keys, deduplication, ETags) are low priority, but switching costs little.
- Changing a stored digest format needs a migration path for existing values.

## References

- https://csrc.nist.gov/projects/hash-functions
