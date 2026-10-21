---
id: private-key-in-repo
title: Remove private keys from the repository and rotate them
applies: [private key]
verified: 2026-10-21
---

## Why

A private key committed to source control should be treated as exposed to everyone with read access, now and in every past clone and fork. This matters regardless of quantum computing.

## Replacement

1. Revoke or rotate the key (issue a new certificate / deploy a new SSH key).
2. Remove the file and purge it from history (`git filter-repo`), then force-push and ask collaborators to re-clone.
3. Load keys at runtime from a secret store (environment, Vault, cloud KMS) and add the pattern to `.gitignore`.
4. When generating the replacement, consider whether it can be post-quantum (ML-DSA / ML-KEM) or at least crypto-agile.

## Before

```text
repo/
  certs/server.key   ← committed
```

## After

```text
repo/
  .gitignore          *.key
  config loads SERVER_KEY from the secret store at startup
```

## Caveats

- Test fixtures with throw-away keys are fine. Mark them clearly or keep them under `test/fixtures/`, and exclude that path from the scan.

## References

- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
