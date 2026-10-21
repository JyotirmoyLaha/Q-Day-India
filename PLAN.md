# Q-Day India — Build Plan

Progress view for the autonomous build (PROJECT_SPEC.md §0). `[x]` = done and verified.

## M0 — Environment & scaffolding
- [x] Project-local toolchain in `.venv/` (Go 1.27.3, pnpm 10, all caches/temp on D:) + `activate.sh` / `activate.ps1`
- [x] Spike: web-tree-sitter 0.27 + grammar WASMs load and run predicates under Node
- [x] Spike: Node 24.11 / OpenSSL 3.5.4 PQ-only handshake (`ecdhCurve: 'X25519MLKEM768'`) against cloudflare.com
- [x] Spike: Go 1.27 exposes `ConnectionState.CurveID` and the X25519MLKEM768 / SecP256r1MLKEM768 / SecP384r1MLKEM1024 constants
- [ ] PLAN.md, DECISIONS.md, CHANGELOG.md, README stub, .gitignore, pnpm workspace, root tooling (Prettier, ESLint, TS base config)

## M1 — Scanner core (Go)
- [ ] `scanner/` module, `go.mod` pinned, `yaml.v3` targets loader + opt-out list
- [ ] Probes P1–P5 (TLS) + H1 (HEAD) with timeouts, 300 ms gap, 1 retry, error codes
- [ ] Certificate analysis (key alg/size, sig alg, issuer, notAfter, chain sig algs, chain validation)
- [ ] Grading (§5.4), hygiene flags, HNDL risk (§5.5) — unit tests + shared parity cases (`schemas/grading-cases.json`)
- [ ] Worker pool (8 hosts), deterministic sorted output, `data/scans/DATE.json` + `data/latest.json`
- [ ] CLI `qday-scan --targets ... --out ... --date ...` and `--host X --json`
- [ ] `schemas/scan.schema.json` + validator script (ajv)
- [ ] Live integration tests behind `QDAY_LIVE_TESTS=1` (cloudflare.com positive, negative fixture) + recorded fixtures for offline tests
- [ ] 20-host seed list (`verified: false`)
- [ ] Done-when: `qday-scan --host cloudflare.com --json` ⇒ `x25519mlkem768: true`, grade A/A+; tests pass; output validates

## M2 — Weekly pipeline + Index UI
- [ ] `.github/workflows/weekly-scan.yml` (cron `17 3 * * 1` + dispatch, schema validation, commit `scan: DATE`)
- [ ] Next.js app (App Router, TS, Tailwind v4, Recharts), theme tokens, dark/light toggle, i18n message catalogue
- [ ] Data layer: build-time loader for `data/latest.json` + history (`data/scans/*`)
- [ ] `/` hero, stat strip, sector chart (with text alternative)
- [ ] `/index` table (search, sector + grade filters, sort by HNDL), sparklines, cards on mobile, "unverified" tag
- [ ] `/site/[host]` report, `/about/scanner`, `/about`
- [ ] UI tests (Vitest + Testing Library + axe), wording-rule test
- [ ] Done-when: index renders real data, filtered & sorted; `pnpm build` passes

## M3 — CBOM engine (Python, JS/TS, config, PEM)
- [ ] `packages/cbom-engine` (no DOM): file walker/filters, tree-sitter loader abstraction (Node + Worker), regex engine
- [ ] YAML rules → compiled JSON; fixes Markdown → compiled JSON
- [ ] Rules: Python, JS/TS, nginx/Apache/HAProxy/OpenSSL/Docker/Terraform/K8s config, PEM/keys, manifests
- [ ] Own DER/PEM/OpenSSH key parser (never outputs key material)
- [ ] Exporters: CycloneDX 1.6 CBOM, SARIF 2.1.0, Markdown — ajv validation vs official schemas
- [ ] Fixture repos + expected findings; precision ≥ 90 %; no private key contents in output
- [ ] Done-when: fixtures produce expected findings and valid CBOM/SARIF

## M4 — `/code` page
- [ ] Web Worker running the engine, streaming progress
- [ ] Inputs: GitHub URL (API tree + raw), zip (JSZip), paste
- [ ] Results: gauges, grouped findings, snippets, fix panels, exports, lz-string fragment share (JSON download fallback > 30 KB)
- [ ] Done-when: public repo scanned end-to-end; only GitHub network calls

## M5 — Java/Kotlin + Go rules, scores
- [ ] Java/Kotlin + Go rules + fixtures
- [ ] Quantum Exposure + Crypto-Agility scores with explainable inputs

## M6 — On-demand scan + badge
- [ ] SSRF guard (hostname validation, IDN→punycode, DNS check of every address, connect to validated IP) + tests (private, localhost, rebinding, IP literals, ports)
- [ ] `/api/scan` (Node runtime, OpenSSL ≥ 3.5 check, probes, 15 s budget, token bucket, cache headers)
- [ ] Fallback UI → prefilled GitHub issue; `.github/workflows/on-demand.yml`
- [ ] `/api/badge` (edge, served from build-time data)
- [ ] Done-when: SSRF suite passes; live scan < 15 s

## M7 — Glue features
- [ ] `/org` combined report + prioritised migration plan mapped to DST phases
- [ ] `/qday` Mosca calculator (prefill from sector / findings)
- [ ] `/report/[month]` generator (sector shares, movers, CDN effect, stragglers)
- [ ] `/learn` primer + animated HNDL diagram

## M8 — GitHub Action + launch polish
- [ ] `action/` composite action + bundled CLI, SARIF upload, CBOM artifact, threshold
- [ ] `.github/workflows/ci.yml` (lint, types, tests, build, go vet/test, schema validation, dogfood)
- [ ] Expand `targets/india.yaml` to 300–500 hosts (`verified: false`), run full scan
- [ ] README (methodology, limitations, sources, badge), BUILD_REPORT.md

## Final self-verification
- [ ] All tests, `pnpm build`, scanner on seed list, page-by-page check (§8), demo-script check (§14)
- [ ] BUILD_REPORT.md
