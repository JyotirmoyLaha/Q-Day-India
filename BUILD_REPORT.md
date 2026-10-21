# Q-Day India — Build Report

Autonomous build of PROJECT_SPEC.md, milestones M1–M8, completed on **2026-10-21**. Progress is tracked in [PLAN.md](PLAN.md), every judgement call is in [DECISIONS.md](DECISIONS.md) (repeated in full at the end of this report), and changes are in [CHANGELOG.md](CHANGELOG.md). Git history has one commit per milestone, plus `scan: 2026-10-21` for the first full dataset.

---

## 1. What was built

| Area | What exists | Where |
|---|---|---|
| **Go TLS scanner** | Probes P1–P5 + HEAD, cert analysis, grade A+…F, hygiene flags, HNDL score, SSRF-guarded dialer (refuses private/reserved IPs), retries, 8-way concurrency, 300 ms gaps, deterministic JSON. CLI `qday-scan --targets … --out … --date …` and `--host X --json`. | `scanner/` |
| **Target list** | 495 public Indian hostnames across all 10 sectors, all `verified: false`; opt-out list | `targets/india.yaml`, `targets/optout.txt` |
| **Data** | First real scan: 495 hosts, schema-validated | `data/latest.json`, `data/scans/2026-10-21.json` |
| **Schemas** | Scan output JSON Schema + validator; Go/TS grading parity cases | `schemas/`, `scripts/validate-scan.mjs` |
| **QuantumBOM engine** | web-tree-sitter (Python, JS/TS/TSX, Java, Go) + regex (Kotlin/Scala, C/C++, C#, Rust, PHP, configs) + PEM/OpenSSH key parser + manifest analysis. 82 YAML rules, 31 dated Markdown fix guides, Exposure/Agility scores, CycloneDX 1.6 / SARIF 2.1.0 / Markdown exporters, inline `quantumbom:ignore`, bundled CLI | `packages/cbom-engine/` |
| **Website** | Next.js 16: `/`, `/index`, `/site/[host]` (495 static pages), `/check`, `/code`, `/org`, `/qday`, `/report` → `/report/2026-10`, `/learn`, `/about`, `/about/scanner`, 404, sitemap, robots. Light/dark themes, i18n message catalogue, production CSP | `apps/web/` |
| **APIs** | `GET/POST /api/scan` (Node runtime, SSRF guard, OpenSSL ≥ 3.5 gate, 15 s budget, token bucket, 24 h cache), `GET /api/badge?host=…/?repo=…` (edge, build-time data) | `apps/web/app/api/` |
| **GitHub Action** | Composite action: bundled CLI → SARIF upload → CBOM artifact → job summary → optional threshold. Dogfooded in CI | `action/` |
| **Workflows** | `ci.yml` (Go + engine + web + bundle freshness + dogfood), `weekly-scan.yml` (Mon 03:17 UTC, validate, commit `scan: DATE`), `on-demand.yml` (issue label `scan-request` → scan → reply) | `.github/workflows/` |
| **Docs** | README, action README, PLAN, DECISIONS, CHANGELOG, this report | repo root |

### First scan results (2026-10-21, real data)

- **495 hosts tracked, 463 reachable, 236 (51%) use quantum-safe key exchange (A+/A).** Grades: A+ 222 · A 14 · B 2 · C 161 · D 61 · F 3 · unreachable 32.
- **The CDN effect is striking:** 98% of hosts behind Cloudflare, Akamai, CloudFront or Fastly are A/A+ (161 of 165), vs. 23% of self-hosted ones (59 of 262).
- By sector, A/A+ share: media 89%, e-commerce 85%, payments 77%, stock broking 75%, insurance 66%, healthcare 53%, telecom 53%, banking 39%, government 27%, education 22%.
- 40 hosts still accept TLS 1.0/1.1.
- 32 hosts were unreachable from the build machine: 15 TIMEOUT, 10 DNS_FAIL, 5 TLS_FAIL, 2 REFUSED. DNS failures most likely mean the drafted hostname is wrong; see the checklist.

## 2. Run it locally

```bash
# Requirements: Node.js ≥ 24.5, pnpm 10 (corepack or npm i -g pnpm@10), Go ≥ 1.26
pnpm install
pnpm --filter web dev                       # http://localhost:3000
pnpm test                                   # engine + web tests + scan schema validation
pnpm go:test                                # Go tests (offline)
QDAY_LIVE_TESTS=1 pnpm go:test              # + live TLS tests (needs internet)
cd apps/web && QDAY_LIVE_TESTS=1 pnpm test  # + live web probes and a live GitHub repo scan
pnpm build                                  # engine + production web build
pnpm scan                                   # full weekly scan locally (writes data/)
node action/dist/cli.mjs scan <dir> --cbom out.cdx.json --sarif out.sarif --md out.md
```

**On this machine** everything was installed into the git-ignored, project-local `.venv/` on D: (Go 1.27.3, pnpm 10.34.7, all caches and temp files). Activate it with `source ./activate.sh` (Git Bash) or `. .\activate.ps1` (PowerShell) before running the commands above. Deleting `.venv/` removes the toolchains completely.

## 3. Deploy (steps only you can do)

1. **GitHub repository:** done. The code is pushed to https://github.com/JyotirmoyLaha/Q-Day-India (keep it public so Actions minutes are free).
2. **Set the site URL and contact email** once Vercel gives you a URL (the GitHub owner is already set to JyotirmoyLaha/Q-Day-India):
   ```bash
   node scripts/set-owner.mjs JyotirmoyLaha https://<your-project>.vercel.app <contact@email>
   git commit -am "chore: set owner and site URL" && git push
   ```
3. **Vercel** (Hobby): *Add New → Project → Import* the repo.
   - **Root Directory:** `apps/web`. Framework: Next.js (from `apps/web/vercel.json`). Leave "Include files outside the root directory" **on**, because the build reads `../../data` and `../../packages`.
   - **Node.js version:** 24.x (pinned by `engines` in `apps/web/package.json`; Node ≥ 24.5 bundles OpenSSL 3.5, which `/api/scan` requires).
   - **Environment variables:** `NEXT_PUBLIC_SITE_URL=https://<your-project>.vercel.app`, `NEXT_PUBLIC_REPO_SLUG=JyotirmoyLaha/Q-Day-India`, `NEXT_PUBLIC_CONTACT_EMAIL=<email>`. Optional: `NEXT_PUBLIC_SHOW_UNVERIFIED=0` to hide unverified hosts.
   - Region: `bom1` (Mumbai) is set in `vercel.json` for the live-scan function.
   - Every push to `main`, including the weekly `scan: DATE` commits, redeploys automatically.
4. **GitHub Actions settings:**
   - *Settings → Actions → General → Workflow permissions:* **Read and write**, so `weekly-scan.yml` can commit `data/`.
   - *Settings → Secrets and variables → Actions → Variables:* add `SITE_URL=https://<your-project>.vercel.app` (used in the scanner User-Agent).
   - *Issues → Labels:* create **`scan-request`** (used by `on-demand.yml` and the "Request a scan" links) and **`opt-out`**.
   - *Security → Code scanning:* SARIF uploads work on public repos. If the dogfood upload fails, enable code scanning there.
5. **Run the weekly scan once by hand:** *Actions → weekly-scan → Run workflow*. Check that it commits `scan: <date>` and that Vercel redeploys.
6. **Publish the Action:** `git tag v1 && git push origin v1`. Users then reference `JyotirmoyLaha/Q-Day-India/action@v1`.
7. Optional: point a custom domain at Vercel and re-run step 2 with it.

## 4. Test results (final run, 2026-10-21)

| Suite | Result |
|---|---|
| Go scanner, offline (`go vet`, `go test ./...`, gofmt clean) | 4 packages pass: grading parity, netguard/SSRF, targets, and probes against local TLS servers (PQ, classical-only, TLS 1.2, legacy-only, untrusted chain, refused, DNS fail) |
| Go scanner, live (`QDAY_LIVE_TESTS=1`) | 2/2 pass: cloudflare.com negotiates **X25519MLKEM768** on P1 and passes P2 (grade A); negative fixture www.aiims.edu fails P2 (grade D) |
| Engine (`vitest`) | **22/22** pass: all 82 rules compile and every tree-sitter query compiles for each grammar; fixtures at **100% recall** and ≥ 90% precision per directory (126 findings, 0 false positives); CycloneDX 1.6 and SARIF 2.1.0 validate against the official schemas with ajv; no private-key material in any output; scores; limits and filters; 1,000-file scan in **0.6 s** |
| Web (`vitest` + Testing Library + axe-core) | **303 pass, 3 skipped** (the live tests): grading parity with Go, schema, filters, fix guidance (every low grade has a fix), axe checks on every page, WCAG AA token contrast in both themes, wording rules on all copy, **60+ SSRF cases** (IP literals and encodings, ports, paths, reserved TLDs, private/CGNAT/link-local/metadata ranges, mapped IPv6, DNS rebinding with a single resolution, mixed answers), rate limit and cache, badges, GitHub source with an audited fetch (3 API calls; token never sent to raw.githubusercontent.com), zip, URL-fragment share, report, plan, Mosca |
| Web, live (`QDAY_LIVE_TESTS=1`) | 3/3 pass: cloudflare.com graded A by the Node prober in **~1.0 s** (< 15 s); AIIMS not PQ; live scan of `auth0/node-jsonwebtoken` (74 files, 37 findings, all true positives on manual review) |
| Lint / types / format | ESLint clean, `tsc --noEmit` clean (engine + web), Prettier clean |
| Build | `pnpm build`: 510 prerendered routes (including 495 SSG site pages) + 2 API routes |
| Scan data | `data/latest.json` and `data/scans/2026-10-21.json` validate against `schemas/scan.schema.json` |
| End-to-end on the production server (`next start`) | All 12 pages plus sitemap.xml and robots.txt return 200, `/report` → 307 to the latest month, unknown route 404, WASM served as `application/wasm`, CSP header present. `/api/scan`: State Bank of India **C** (1.7 s), HDFC Bank **A+** (0.9 s), both matching the weekly Go scan; repeat call served from cache with `s-maxage=86400`; `localhost`, `127.0.0.1`, `example.com:22`, `http://169.254.169.254/`, `metadata.google.internal`, `[::1]` and POST `10.0.0.1` all rejected with 400. Badges render with grade and date |
| Dogfood (QuantumBOM on this repo) | 133 files, 0 findings, 5 suppressed with justification (an intentional legacy-TLS probe; key-type inspection imports): Exposure 0, Agility 100 |

### Demo script (§14) dry run

1. `/`: "51% of tracked Indian sites use quantum-safe key exchange", plus the sector chart. ✔
2. Live grade of an Indian bank: `/check?host=www.onlinesbi.sbi` → C, HNDL 60, fixes listed; www.hdfcbank.com → A+. ✔
3. `/code` with a public repo: pipeline verified under Node with live GitHub (findings stream, RSA finding → fix panel, CBOM export). **A real-browser run is on your checklist.**
4. `/qday`: government preset (X = 25) gives "You are N years late". ✔ (tested)
5. README badge ✔ · GitHub Action annotating a PR: needs the repo on GitHub (checklist).
6. `/report/2026-10` ✔

## 5. Known limitations

- **No real-browser verification.** Headless Chromium/Playwright is forbidden by the spec, so the in-browser `/code` worker, the visual design and Lighthouse scores were not checked in an actual browser. Everything around them is tested (DECISIONS #12, #24).
- **Screenshots** for the README are not included for the same reason.
- **Target list accuracy:** 495 hostnames were drafted from public knowledge. Some are wrong (10 DNS failures) and none are verified. The site shows them with an `unverified` tag.
- **Geo-blocking:** some Indian government and bank hosts timed out from the build machine. GitHub's US runners may see more timeouts. They are shown as "not reachable", never graded or blamed.
- **TLS checks see only the public edge** (often a CDN), not back-end connections. Certificates cannot be PQ yet, so grades reflect key exchange only.
- **Static analysis** misses algorithms chosen at runtime (e.g. `createSign('RSA-SHA' + bits)`) and can flag intentional uses (suppress with `quantumbom:ignore`).
- **The DST roadmap phases** come from public summaries, because the report PDF is currently offline (DECISIONS #19).
- **Rate limiting and caching** in `/api/scan` are per serverless instance (best effort, as the spec allows).
- **Node cannot name hybrid groups;** the live API infers X25519MLKEM768 (DECISIONS #15). The Go scanner reads the exact CurveID.
- Hindi/Bengali UI, APK scanning and email digests (stretch goals) were not built.

## 6. Checklist — things only you can verify or do

- [ ] **Verify the target domains** in `targets/india.yaml`. Flip `verified: true` per host once confirmed, and fix or remove wrong ones. Start with the unreachable hosts:
  - DNS_FAIL (hostname probably wrong): `edistricts.up.gov.in`, `enps.nsdl.com`, `omni.axisbank.co.in`, `punjabandsindbank.co.in`, `www.aiimsbhubaneswar.nic.in`, `www.aiimsjodhpur.edu.in`, `www.futuregenerali.in`, `www.ippbonline.com`, `www.kvb.co.in`, `www.onlineservices.nsdl.com`
  - TIMEOUT / REFUSED / TLS_FAIL (possibly geo-blocked or not HTTPS on that name): `assam.gov.in`, `bankofmaharashtra.in`, `canarabank.com`, `gujaratindia.gov.in`, `jk.gov.in`, `mp.gov.in`, `mtnl.in`, `nciipc.gov.in`, `nitkkr.ac.in`, `www.cdac.in`, `www.drdo.gov.in`, `www.idbibank.in`, `www.iitdh.ac.in`, `www.iob.in`, `www.jiopaymentsbank.com`, `www.ap.gov.in`, `www.iiml.ac.in`, `eportal.incometax.gov.in`, `unifiedportal-mem.epfindia.gov.in`, `www.indianrail.gov.in`, `www.karnataka.gov.in`, `www.nta.ac.in`
- [ ] Do the deployment steps in §3 (`set-owner` for the site URL, Vercel, Actions permissions, labels, `SITE_URL` variable, tag `v1`).
- [ ] **Run the live tests once** on a machine with internet: `QDAY_LIVE_TESTS=1 pnpm go:test` and `cd apps/web && QDAY_LIVE_TESTS=1 pnpm test`. They passed during the build; re-run them from your own network.
- [ ] **Browser check of `/code`:** scan `https://github.com/auth0/node-jsonwebtoken`. Findings should stream in, an RSA finding should open its fix, the CBOM should download, and Share should copy a `#r=` link that reopens the report. DevTools → Network should show only `api.github.com`, `raw.githubusercontent.com` and the site itself.
- [ ] **Browser check of every page** in light and dark mode, at phone width (the index should become cards), with keyboard-only navigation.
- [ ] **Lighthouse** on `/` and `/index` (target ≥ 90 for Performance, Accessibility, Best Practices and SEO) on the deployed site; fix anything below.
- [ ] **Screenshots** for the README (`docs/screenshots/`).
- [ ] Confirm `/api/scan` works on Vercel: `https://<site>/api/scan?host=cloudflare.com` should return grade A/A+. If it returns 503 `PQ_TLS_UNAVAILABLE`, the Node runtime isn't 24.5+. Check the Vercel Node setting; the GitHub-issue fallback works either way.
- [ ] Open a test issue titled `scan-request: cloudflare.com` with the `scan-request` label and check that the workflow replies.
- [ ] After the first weekly run, check `/report/<month>` shows movers, and that the dogfood SARIF appears under *Security → Code scanning*.
- [ ] Review the wording on `/about`, `/learn` and the DST roadmap mapping on `/org` against the official DST report once it is republished.
- [ ] Optional: delete the local toolchain with `rm -rf .venv` once you've installed Go/pnpm your own way.

## 7. Housekeeping on this machine

- All toolchains, caches and temp files for this build live under `D:\QuantaKavach\.venv\` (git-ignored).
- Items briefly created on C: during setup were removed: the portable Go download (moved to D:), the global pnpm install, the npm cache, Go's telemetry folder under `%APPDATA%\go`, and the Node compile cache in `%TEMP%`. The activation scripts now redirect `APPDATA`/`LOCALAPPDATA`/`NODE_COMPILE_CACHE` into `.venv` too.

---

## Appendix: every decision (copied from DECISIONS.md)

Each entry: what the spec said or left open, what was chosen, and why.

1. **Project-local toolchain (`.venv/`).** The owner asked for a virtual environment and to keep the C: drive clean. Go 1.27.3 (portable zip, SHA-256 verified), pnpm 10.34 and every cache (Go build/module cache, npm cache, pnpm store, XDG dirs, TEMP) live in `.venv/`, activated with `source ./activate.sh` (bash) or `. .\activate.ps1` (PowerShell). `.venv/` is git-ignored. CI uses the normal `setup-go` / `pnpm/action-setup` actions instead.
2. **Unverified hosts are shown, not hidden.** §5.3 says "the website shows only verified entries", but §0 says to show unverified entries with an "unverified" tag so the product is complete. §0 wins. Unverified entries carry a visible `unverified` tag everywhere. To switch to "verified only" later, set `NEXT_PUBLIC_SHOW_UNVERIFIED=0`.
3. **Go version.** go.mod pins `go 1.26` because P3 needs `tls.SecP256r1MLKEM768` / `tls.SecP384r1MLKEM1024`, which were added in Go 1.26 (X25519MLKEM768 and `ConnectionState.CurveID` came earlier). Developed and tested with Go 1.27.3, which the workflows pin explicitly (`go-version: 1.27.3`).
4. **TypeScript 5.9.** TypeScript 7.0 (the native port) is the npm `latest`, but typescript-eslint supports only `<6.1`, so TS is pinned to 5.9.3.
5. **pnpm 10** is used instead of pnpm 12 (the npm `latest`) for wider compatibility with Vercel and `pnpm/action-setup`. It's pinned through `packageManager` in the root `package.json`.
6. **Rule format: call rules and query rules.** Most tree-sitter rules don't hand-write a query per rule. They match a generic per-language call extraction (callee text, positional/keyword arguments, object-literal props) with data-only conditions, which keeps rules readable and consistent across grammars. Raw tree-sitter queries (`query:`) remain available, and are used for imports, attribute access, object literals and Go struct fields. Callee matching is case-sensitive; variant matching is case-insensitive.
7. **Key material parsing uses a small built-in DER/ASN.1 reader** instead of `@peculiar/x509` / `pkijs`. Those need `reflect-metadata`/WebCrypto plumbing and add ~200 KB to the worker; we only need algorithm OIDs, key sizes, names and dates. The reader never returns key bytes, and snippets for key files are replaced with redacted markers. A test checks that no line of the fixture private keys appears in any output.
8. **Kotlin, Scala, C/C++, C#, Rust and PHP use regex rules** (medium confidence, comment lines skipped). Only Python, JS/TS/TSX, Java and Go have tree-sitter grammars bundled, to keep the browser download small (~5 MB of WASM, cached immutably).
9. **Manifest findings are low-confidence inventory.** Most library entries are `quantum_risk: NONE` with a note on PQC support (e.g. "cryptography < 48 has no ML-KEM"). Only single-purpose classical libraries (elliptic, node-rsa, tweetnacl…), unmaintained ones (PyCrypto, crypto-js) and toolchain floors (Go < 1.24, Node < 22.20) are flagged.
10. **Score formulas** (§6.5 left the exact curve open): Exposure = `100 × (1 − e^(−W / (6 × log2(2 + files))))` with weights KEM/key-agreement 10, PKE/signature 8, classically broken 3, Grover 1, scaled by confidence (1 / 0.7 / 0.4). Agility = `100 × (1 − (files − 1) / hardcoded findings)`. Both are documented on /about and in `src/scores.ts`.
11. **Fix guidance was verified on 2026-10-21** against current sources: pyca/cryptography ≥ 48 ships ML-KEM/ML-DSA (Trail of Bits, June 2026); Go has `crypto/mlkem` since 1.24 and `crypto/mldsa` in 1.27 (checked in the local Go 1.27.3 docs); Node 24 `ml-kem-768`/`ml-dsa-65` with `crypto.encapsulate` (checked on Node 24.11.1); JDK 27 has hybrid TLS by default (JEP 527); BouncyCastle 1.79 added ML-KEM/ML-DSA/SLH-DSA; OpenSSH 10 defaults to `mlkem768x25519-sha256`; AWS `*-PQ-2025-09` ELB policies; hybrid TLS groups are now RFC 10024.
12. **In-browser verification of `/code`.** The spec forbids headless Chromium/Playwright, so the browser path was checked by (a) running the exact worker pipeline (`lib/sources.ts` + engine + exporters) under Node against a mocked GitHub that audits every request (3 API calls; token only to api.github.com; none to raw.githubusercontent.com), (b) a live scan of `auth0/node-jsonwebtoken` (74 files, 37 findings, all true positives on manual review), (c) checking that Turbopack emits a dedicated worker bootstrap and that web-tree-sitter's Node-only code is environment-guarded. A real-browser click-through is on the human checklist in BUILD_REPORT.md.
13. **Content-Security-Policy** (production only, since Next dev mode needs eval): `connect-src 'self' https://api.github.com https://raw.githubusercontent.com`. This makes "code never leaves the browser" technically enforced: the page cannot send data anywhere else.
14. **`/api/scan` supports GET as well as POST.** The spec names `POST /api/scan`, but POST responses are never CDN-cached, which would make `s-maxage=86400` useless. The UI uses `GET /api/scan?host=…` (cacheable per host at Vercel's edge); POST `{host}` is kept for API clients. Successful results are also cached in memory for 24 h (best effort, per instance), and cache hits don't spend rate-limit tokens.
15. **Naming the negotiated group in Node.** `getEphemeralKeyInfo()` returns no name for hybrid groups in Node 24.11. P1 offers exactly one PQ group (X25519MLKEM768) alongside classical ones, so an unnamed TLS 1.3 group plus a passing P2 is reported as `X25519MLKEM768`. Verified against cloudflare.com, where it agrees with the Go scanner, which reads `ConnectionState.CurveID` directly.
16. **Certificate details in Node come only from the `X509Certificate` API** (`getPeerX509Certificate`, `checkHost`, `issuerCertificate` chain), because `getPeerCertificate()` returned an empty object for TLS 1.3 sessions with `rejectUnauthorized: false`. Chain trust comes from `socket.authorized` (Node's bundled Mozilla roots).
17. **Ad-hoc scans use sector `other`** (shelf life 10 years, weight 0.5) unless the host is already in the target list, in which case its sector and shelf life are used. The schema allows `other` for this reason.
18. **Live-scan IP preference:** the first validated IPv4 address is used when available (more reliable from serverless egress), else the first IPv6 address. Every address must pass the public check before any connection is made.
19. **DST roadmap phases.** The PDF URL in the spec (§15) returns 404, and DST says the final report was pulled temporarily for re-publication. The phases used on `/org` and `/learn` come from public summaries of the report: CII foundations 2027, high-priority 2028, full adoption 2029; enterprises 2028, 2030, 2033. The UI states this source caveat. `/about` links DST's landing page (`dst.gov.in/quantum-safe-ecosystem-in-india`) instead of the dead PDF. Track defaults: telecom and government → CII, everything else → enterprise, switchable by the user, because summaries disagree on whether BFSI is CII.
20. **Mosca defaults:** Z defaults to 10 years (user-adjustable 1–40, with no claim about when Q-Day is). The migration-time heuristic `Y = 1 + 0.75·log₂(1 + HIGH findings)`, capped at 15, is labelled as a heuristic in the UI.
21. **The `/` sector chart is plain HTML/CSS bars**, not Recharts, so the home page ships almost no chart JavaScript (for Lighthouse). Recharts is used on `/report/*` and `/site/*`, where interactivity helps. Every chart has a data table or text alternative.
22. **Inline suppressions (`quantumbom:ignore`)** on the same or the previous line. They're needed for honest dogfooding: this repo intentionally offers TLS 1.0/1.1 in its legacy probe and imports `crypto/rsa`/`crypto/ecdsa` only to read certificate key sizes. Suppressed findings are counted in `stats.suppressed` and shown in the UI and Markdown, so nothing is hidden silently.
23. **The GitHub Action is a composite action** around the esbuild-bundled CLI (`action/dist/cli.mjs` + WASM, committed; CI fails if the bundle is stale). SARIF upload uses `github/codeql-action/upload-sarif@v4` and the CBOM uses `actions/upload-artifact@v7`. The repo badge (`/api/badge?repo=`) reads `data/repos/*.json`, which `pnpm dogfood` writes; other repos can be added by PR. A badge service must never scan on request, and this one doesn't.
24. **Not done, needs a real browser (forbidden in the build environment):** Lighthouse scores and README screenshots. Mitigations in place: `/` and `/index` are static (SSG); the home chart is plain HTML; fonts are self-hosted via `next/font`; the index paginates 50 rows at a time; Recharts loads only on report and site pages. The human checklist in BUILD_REPORT.md covers running Lighthouse once.
25. **Stretch goals not built:** Hindi/Bengali UI (strings are already in `messages/en.json` with a `t()` helper, ready for `hi.json`/`bn.json`), APK scanning, email digests. **Built:** the Shor-factors-15 explainer on `/learn`, and regex rules for C/C++, C#, Rust and PHP.
26. **Activation scripts also redirect `APPDATA`/`LOCALAPPDATA`/`NODE_COMPILE_CACHE` into `.venv`.** Go telemetry and Node's compile cache otherwise write to the C: profile. They only change the current shell.
