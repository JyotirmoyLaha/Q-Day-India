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
