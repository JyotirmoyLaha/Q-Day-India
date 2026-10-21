# Q-Day India

> **Scan India's websites and your code for quantum risk — then fix it.**

[![ci](https://github.com/JyotirmoyLaha/Q-Day-India/actions/workflows/ci.yml/badge.svg)](https://github.com/JyotirmoyLaha/Q-Day-India/actions/workflows/ci.yml)
[![quantum exposure](https://qday-india.vercel.app/api/badge?repo=JyotirmoyLaha/Q-Day-India)](https://qday-india.vercel.app/code)
[![weekly scan](https://github.com/JyotirmoyLaha/Q-Day-India/actions/workflows/weekly-scan.yml/badge.svg)](https://github.com/JyotirmoyLaha/Q-Day-India/actions/workflows/weekly-scan.yml)

A future large quantum computer running Shor's algorithm will break RSA, Diffie-Hellman and elliptic-curve cryptography. Attackers can **record encrypted traffic today and decrypt it later** ("harvest now, decrypt later"). Q-Day India measures both halves of the migration to post-quantum cryptography (PQC):

| | Question | Where it runs |
|---|---|---|
| **Sites: Quantum Readiness Index** | Which Indian banks, government portals, payment and education sites already use quantum-safe TLS key exchange (X25519MLKEM768)? | Go scanner on GitHub Actions (weekly) + live check on a Vercel function |
| **Code: QuantumBOM** | Where in my code is quantum-vulnerable crypto, and how do I fix it? | 100% in your browser (Web Worker + WASM tree-sitter), or as a GitHub Action |

Plus an **organisation report** mapped to India's DST Task Force roadmap, a **Mosca Q-Day calculator**, **README badges**, and a monthly **State of the Nation** report. It runs for ₹0 on free tiers.

> Screenshots: see `docs/screenshots/` (to be captured after the first deployment — see BUILD_REPORT.md).

## Features

- **Weekly index of 495 Indian hosts** across banking, payments, government, stock broking, insurance, healthcare, telecom, e-commerce, education and media, with grade history, sector charts and per-site fix guidance. (Hostnames are drafted from public information and shown with an *unverified* tag until a maintainer confirms them.)
- **Five TLS probes + one HEAD per host**: default handshake, PQ-only (X25519MLKEM768), alternative hybrids (SecP256r1MLKEM768 / SecP384r1MLKEM1024), TLS 1.3-only, legacy TLS 1.0/1.1, plus HSTS and CDN detection. [Grading](https://qday-india.vercel.app/about#grading) runs A+ … F, with a Harvest-Now-Decrypt-Later exposure score from 0 to 100.
- **Live check** of any public hostname (`/check`, `/api/scan`), with mandatory SSRF protection: hostname-only input, IDN→punycode, every resolved address must be public, and the connection goes to the validated IP. A GitHub-issue fallback (`on-demand.yml`) covers runtimes without OpenSSL 3.5.
- **QuantumBOM** (`/code`): scan a public GitHub repo, a zip or a pasted file. 82 data-driven rules cover Python, JS/TS/TSX, Java, Go (tree-sitter) and Kotlin/Scala/C/C++/C#/Rust/PHP (regex). It also checks nginx/Apache/HAProxy/OpenSSL/Docker/Terraform/Kubernetes/SSH configs, key files (PEM/OpenSSH, never displaying key material) and dependency manifests. Output: **CycloneDX 1.6 CBOM**, **SARIF 2.1.0** and **Markdown**, all validated against the official schemas. Reports can be shared through the URL fragment, which no server ever sees.
- **31 dated fix guides** with before/after code: OpenSSL 3.5 + nginx/Apache/HAProxy, Go 1.24+/1.27 `crypto/mlkem`/`crypto/mldsa`, Node 24 `ml-kem-768`, JDK 24+ ML-KEM/ML-DSA (JDK 27 hybrid TLS), pyca/cryptography ≥ 48, AWS `*-PQ-2025-09` policies, OpenSSH 10 and more.
- **GitHub Action** (`action/`): SARIF to Code Scanning, CBOM artifact, job summary, optional exposure threshold, inline `quantumbom:ignore` suppressions. This repo dogfoods it.

## Repository layout

```
apps/web/                 Next.js 16 (App Router, TS, Tailwind v4, Recharts) — all pages, /api/scan, /api/badge, Web Worker
packages/cbom-engine/     QuantumBOM engine: rules/*.yaml, fixes/*.md, exporters, CLI, fixtures
scanner/                  Go TLS scanner (qday-scan)
action/                   Composite GitHub Action + bundled CLI (dist/)
targets/india.yaml        Target list (all verified: false until checked)   targets/optout.txt
data/latest.json          Latest scan        data/scans/YYYY-MM-DD.json   History
data/repos/*.json         Repo badge data (dogfood)
schemas/                  scan.schema.json, grading parity cases (shared by Go and TS)
.github/workflows/        ci.yml, weekly-scan.yml, on-demand.yml
```

## Run locally

Requirements: Node.js ≥ 24.5 (bundles OpenSSL 3.5), pnpm 10, Go ≥ 1.26.

```bash
pnpm install
pnpm --filter web dev            # http://localhost:3000  (prebuild compiles data, rules and WASM)
pnpm test                        # engine + web tests + scan schema validation
pnpm go:test                     # Go scanner tests (offline)
QDAY_LIVE_TESTS=1 pnpm go:test   # + live TLS tests against cloudflare.com and a negative fixture

# Scanner
cd scanner && go run ./cmd/qday-scan --host cloudflare.com --json
go run ./cmd/qday-scan --targets ../targets/india.yaml --out ../data --date 2026-10-21

# QuantumBOM CLI on any directory
node action/dist/cli.mjs scan path/to/repo --cbom out.cdx.json --sarif out.sarif --md out.md
```

On this development machine, everything (toolchains, caches, temp files) lives in a git-ignored project-local environment: `source ./activate.sh` (bash) or `. .\activate.ps1` (PowerShell).

## Use the GitHub Action

```yaml
permissions: { contents: read, security-events: write }
jobs:
  cbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: JyotirmoyLaha/Q-Day-India/action@v1
        with:
          exclude: 'test/fixtures/**'
          fail-above: '80'
```

See [action/README.md](action/README.md).

## Badges

```markdown
![quantum-safe TLS](https://qday-india.vercel.app/api/badge?host=www.example.in)
![quantum exposure](https://qday-india.vercel.app/api/badge?repo=OWNER/NAME)
```

Badges are served from the latest weekly data and cached by the CDN. Viewing one never triggers a scan.

## Methodology (summary)

- **Grade (key exchange only):** A+ = X25519MLKEM768 supported and negotiated by default, legacy TLS off · A = same, legacy TLS on · B = a PQ hybrid supported but not default · C = TLS 1.3 without PQ · D = TLS 1.2 max · F = TLS < 1.2 only or invalid chain · — = unreachable.
- **HNDL exposure** = `round(100 × exposure × (0.6 × shelf + 0.4 × sector weight))`.
- **Certificates** are always classical today: post-quantum certificates do not exist in the WebPKI yet, so they never affect the grade.
- **Code scores:** Quantum Exposure (weighted findings on a log curve by repo size) and Crypto-Agility (how centralised hardcoded algorithm choices are).

Full details: [/about](https://qday-india.vercel.app/about) · Responsible scanning and opt-out: [/about/scanner](https://qday-india.vercel.app/about/scanner).

## Limitations

- TLS checks see only the public edge (often a CDN), not internal or back-end connections.
- Certificates cannot be post-quantum yet; grades reflect key exchange only.
- Static code analysis has false positives and misses algorithms chosen at runtime; confidence levels are shown.
- Quantum-computer timelines are uncertain; the Q-Day calculator lets you choose your own estimate.
- The target list was drafted from public information and needs human verification (`verified: false`).

## Sources

- DST Task Force, *Implementation of Quantum Safe Ecosystem in India* (Feb 2026) — https://dst.gov.in/quantum-safe-ecosystem-in-india
- NIST FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA) — https://csrc.nist.gov/pubs/fips/203/final
- RFC 10024, hybrid ML-KEM key agreement for TLS 1.3 — https://www.rfc-editor.org/info/rfc10024
- OpenSSL 3.5 — https://github.com/openssl/openssl/releases · Go X25519MLKEM768 — https://github.com/golang/go/issues/69985
- Cloudflare PQC support matrix — https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/
- CycloneDX 1.6 — https://cyclonedx.org/docs/1.6/json/ · SARIF 2.1.0 — https://docs.oasis-open.org/sarif/sarif/v2.1.0/

## Contributing

Corrections to the target list are the most valuable contribution: open a PR that flips `verified: true` with a source, or fixes a hostname. Rules are YAML (`packages/cbom-engine/rules/`) and fixes are Markdown (`packages/cbom-engine/fixes/`). Each needs a fixture line marked `expect: <rule-id>`. Keep the wording rules: describe sites as "not yet quantum-safe", never as "vulnerable" or "hacked". CI enforces this.

## License

Code: MIT (see `LICENSE`). Scan data in `data/`: CC BY 4.0.
