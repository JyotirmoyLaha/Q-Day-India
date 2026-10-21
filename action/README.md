# QuantumBOM GitHub Action

Finds quantum-vulnerable cryptography (RSA, ECDH/ECDSA, DH, Ed25519…), classically weak crypto (MD5, SHA-1, DES, RC4, TLS 1.0/1.1) and post-quantum adoption in your repository, then:

- uploads **SARIF 2.1.0** to GitHub Code Scanning, so findings appear as alerts and PR annotations;
- uploads a **CycloneDX 1.6 CBOM** (cryptographic bill of materials) and a Markdown report as a build artifact;
- writes a summary with the **Quantum Exposure** and **Crypto-Agility** scores to the job page;
- optionally **fails the build** above an exposure threshold.

The scan runs entirely on the runner. No code is sent anywhere.

## Usage

```yaml
name: quantumbom
on: [push, pull_request]

permissions:
  contents: read
  security-events: write   # for the SARIF upload

jobs:
  cbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: YOUR_GITHUB_USER/qday-india/action@v1
        with:
          exclude: 'test/fixtures/**'
          fail-above: '80'      # optional
```

## Inputs

| Input | Default | Description |
|---|---|---|
| `path` | `.` | Directory to scan |
| `exclude` | | Comma-separated globs to skip (e.g. `test/fixtures/**,docs/**`) |
| `fail-above` | | Fail when Quantum Exposure is above this value |
| `upload-sarif` | `true` | Upload SARIF to Code Scanning |
| `sarif-category` | `quantumbom` | Code Scanning category |
| `artifact-name` | `quantumbom-cbom` | Artifact name |
| `output-dir` | `quantumbom-output` | Output directory |

Outputs: `exposure`, `agility`, `findings`, `cbom`, `sarif`.

## Badge

Repositories registered in the Q-Day India repo (`data/repos/*.json`) get a badge:

```markdown
![quantum exposure](https://qday-india.vercel.app/api/badge?repo=OWNER/NAME)
```

## How it works

`dist/cli.mjs` is the [`@qday/cbom-engine`](../packages/cbom-engine) CLI bundled with esbuild, plus the tree-sitter WASM grammars in `dist/wasm/`. Rebuild it with `pnpm --filter @qday/cbom-engine build`. CI checks that the committed bundle is up to date.
