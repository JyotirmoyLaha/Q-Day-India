# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Project-local toolchain (`activate.sh` / `activate.ps1`), PLAN.md, DECISIONS.md.
- Go TLS scanner (`scanner/`): probes P1–P5 + HEAD, certificate analysis, quantum grade, hygiene flags,
  HNDL risk, SSRF-guarded dialer, deterministic JSON output, `qday-scan` CLI, offline tests with local TLS
  servers and live tests behind `QDAY_LIVE_TESTS=1`.
- `schemas/scan.schema.json` + `scripts/validate-scan.mjs`; shared grading parity cases.
- 20-host seed target list (all `verified: false`) and first real scan (`data/scans/2026-10-21.json`).
- Weekly scan workflow (`.github/workflows/weekly-scan.yml`).
- Next.js 16 web app: `/`, `/index`, `/site/[host]`, `/about`, `/about/scanner`; light/dark themes, i18n message
  catalogue, build-time data pipeline (`apps/web/scripts/prebuild.mjs`), grading TS twin with Go parity tests,
  axe accessibility tests, wording-rule and contrast tests.
- `packages/cbom-engine` (QuantumBOM): web-tree-sitter engine with data-only YAML rules (82 rules: Python,
  JS/TS/TSX, Java, Go, Kotlin/Scala, C/C++, C#, Rust, PHP, nginx/Apache/HAProxy/OpenSSL/Docker/Terraform/K8s/SSH
  configs, dependency manifests), own DER/PEM/OpenSSH key parser (no key material in output), 31 dated fix guides,
  Quantum Exposure + Crypto-Agility scores, CycloneDX 1.6 / SARIF 2.1.0 / Markdown exporters validated against the
  official schemas, fixture suite (100% recall, ≥ 90% precision), bundled `quantumbom` CLI.
- `/code` QuantumBOM page: Web Worker scanning (GitHub URL via API tree + raw files, zip via JSZip, paste),
  streamed progress, Exposure/Agility gauges with score inputs, findings grouped by risk and file, fix panels,
  CBOM/SARIF/Markdown export, lz-string URL-fragment sharing (JSON download fallback > 30 KB), production CSP that
  restricts network access to the site itself and GitHub.
