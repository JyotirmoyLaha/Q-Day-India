# Q-Day India — Project Specification

> **Scan India's websites and your code for quantum risk — then fix it.**

This document is the single source of truth for building Q-Day India. It is written for an AI coding agent (Claude Code) and a human developer working together. Read it fully before writing code.

---

## 0. Instructions for the coding agent

### Operating mode: FULL AUTONOMOUS BUILD

**Build the entire project, M1 through M8 (Section 12), in one continuous run, without stopping to ask the human for review.** The human will review only the finished product. Work like this:

1. **Plan first.** Read this whole document, then write `PLAN.md` with every milestone broken into tasks. Keep it updated (tick tasks off) as you go — it is the human's progress view.
2. **Build → test → debug loop, per milestone.** For each milestone: implement, run the full test suite, lint and type-check, run the app/scanner and check the output yourself. If anything fails, read the error, fix it and re-run. Repeat until the milestone's "Done when" criteria pass. Only then move to the next milestone.
3. **Never stop on a problem — solve it or work around it.** If something in this spec is impossible, wrong or blocked (a library doesn't work, an API changed, a runtime lacks a feature), choose the closest workable alternative, record the reason and the choice in `DECISIONS.md`, and keep going.
4. **Do not ask questions.** Where the spec is ambiguous, pick the most reasonable option, note it in `DECISIONS.md`, and continue.
5. **Self-verify at the end.** After M8, run every test, `pnpm build`, the scanner on the seed list, and a full end-to-end check of each page (Section 8) and each demo step (Section 14). Fix anything broken.
6. **Finish with `BUILD_REPORT.md`** containing: what was built, how to run it locally, how to deploy (Vercel + GitHub Actions setup steps the human must do, e.g. connecting the repo to Vercel), test results, known limitations, every `DECISIONS.md` item, and a checklist of things the human must verify (see below).

### Things only the human can do (do not block on them)

- **Verify the target domains** in `targets/india.yaml`. Draft the full list (300–500 hosts), mark each `verified: false`, and make the site show unverified entries with an "unverified" tag (not hidden) so the product is complete. The human will flip them to `true` later.
- **Accounts and deployment**: creating the GitHub repo, connecting Vercel, enabling Actions. Prepare all config files and write exact step-by-step instructions in `BUILD_REPORT.md`.
- Network-dependent integration tests (live TLS scans of real sites) may fail in a sandbox without internet. Put them behind a flag (`QDAY_LIVE_TESTS=1`), make all other tests pass offline using recorded fixtures, and note in `BUILD_REPORT.md` that live tests must be run once by the human.

### Hard rules (never break these)

1. **Verify assumptions empirically.** Where this spec says "verify", write a small test or script and confirm behaviour before building on it. Library APIs and runtime versions change; trust tests over this document.
2. **Zero-cost constraint is hard.** No paid services, no VPS, no headless Chromium. Allowed: Vercel Hobby, GitHub (public repo + Actions), the user's own browser, free public APIs.
3. **Privacy constraint is hard.** User code scanned in Module B never leaves the user's browser unless they explicitly click "Share", and even then it goes into a URL fragment (never to a server).
4. **Honesty constraint is hard.** Never claim a site is "hacked", "breached" or "vulnerable today". Quantum risk is about *future* decryption. Use the wording rules in Section 10.
5. **SSRF protection** on the on-demand scan API (Section 5.6) is mandatory and must have passing tests.
6. Commit after each completed task with a clear message, write tests alongside features, and keep `CHANGELOG.md` updated.

---

## 1. The idea in one minute

A future, large quantum computer running **Shor's algorithm** will break RSA, Diffie-Hellman and elliptic-curve cryptography — the public-key crypto that protects almost every HTTPS connection, digital signature and login today. Attackers can already **record encrypted traffic now and decrypt it later** ("Harvest Now, Decrypt Later", HNDL). Sensitive data with a long shelf life (banking, health, identity, government) is at risk *today*.

The fix is **post-quantum cryptography (PQC)**: new algorithms standardised by NIST in 2024 — **ML-KEM** (FIPS 203, key exchange), **ML-DSA** (FIPS 204, signatures) and **SLH-DSA** (FIPS 205, hash-based signatures). Browsers and CDNs already use the hybrid TLS key exchange **X25519MLKEM768**.

India's DST Task Force under the National Quantum Mission published *"Implementation of Quantum Safe Ecosystem in India"* (Feb 2026), setting a phased migration roadmap with critical sectors starting around 2027 and reportedly a CBOM (Cryptographic Bill of Materials) requirement on the horizon.

**Q-Day India has two modules, merged into one product:**

| Module | Question it answers | Where it runs |
|---|---|---|
| **A. Sites — Quantum Readiness Index** | "Which Indian banks, government portals, payment and education sites already use quantum-safe TLS?" | Go scanner on GitHub Actions (weekly) + on-demand Vercel function |
| **B. Code — QuantumBOM** | "Where in my codebase is quantum-vulnerable crypto, and how do I fix it?" | 100% in the user's browser (Web Worker + WASM) |

Plus the **glue features** (Section 7) that make it stand out: an org-level unified report, a Mosca "Q-Day" calculator, a GitHub Action + README badge, and an auto-generated "State of Quantum Readiness in India" report.

---

## 2. What makes this project stand out

Keep these front-of-mind; they are the reason this project exists.

1. **India-first public dataset.** A weekly-updated Quantum Readiness Index of 300–500 Indian sites, with history and trends. Nobody publishes this for India.
2. **Two halves of the migration in one tool.** Network (TLS) *and* code (CBOM). Most tools do one.
3. **Policy-aligned.** Findings are mapped to the DST Task Force roadmap and CycloneDX CBOM output — exactly what organisations will be asked to produce.
4. **Privacy-first code scanning.** Code never leaves the browser. Reports are shared via compressed URL fragments.
5. **Actionable, not alarmist.** Every finding comes with a copy-paste fix.
6. **Developer workflow integration.** A reusable GitHub Action and an embeddable README badge.
7. **Zero running cost.** Runs forever for ₹0.

---

## 3. Background primer (for the agent and for the site's "Learn" page)

- **Shor's algorithm** breaks RSA, DH, DSA, ECDH, ECDSA, Ed25519 → treat all as **quantum-vulnerable (HIGH)**.
- **Grover's algorithm** roughly halves symmetric key strength → AES-128 becomes ~64-bit security against a quantum attacker (**LOW risk**, recommend AES-256). SHA-256/384 remain acceptable.
- **Already classically broken** (not a quantum issue, but flag anyway): MD5, SHA-1 for signatures, DES/3DES, RC4, RSA < 2048.
- **Hybrid key exchange**: `X25519MLKEM768` combines classical X25519 with ML-KEM-768, so it's at least as strong as either. IANA codepoint **4588** (`0x11EC`). Also `SecP256r1MLKEM768` (4587) and `SecP384r1MLKEM1024` (4589).
- **PQ key exchange requires TLS 1.3.**
- **Certificates are not PQ yet anywhere on the public web.** WebPKI certificates are still RSA/ECDSA. So: a site *can* protect its traffic against HNDL today (PQ key exchange) but *cannot* yet have a PQ certificate. Score accordingly and say so on the site.
- **Mosca's inequality**: if `X + Y > Z` you're already late, where
  - `X` = how many years the data must stay secret (shelf life),
  - `Y` = how many years the migration will take,
  - `Z` = years until a cryptographically relevant quantum computer (CRQC) exists.

---

## 4. Constraints and non-goals

**Constraints**
- ₹0 running cost. Vercel Hobby + GitHub public repo + Actions.
- No VPS, no Chromium/Playwright, no paid DB.
- Module B code never uploaded.
- Site scanning = normal TLS handshakes + one HTTP HEAD per host, on port 443 only.

**Non-goals (do not build)**
- No port scanning, no vulnerability exploitation, no login attempts, no crawling beyond the listed hostname.
- No private/internal network scanning (SSRF protection is mandatory — Section 5.6).
- No user accounts in MVP.
- No claims about specific data being exposed.

---

## 5. Module A — Sites: Quantum Readiness Index

### 5.1 What to measure per hostname

For each hostname, run these probes (each is a separate TLS handshake to `host:443` with SNI = host):

| Probe | How | Records |
|---|---|---|
| **P1 Default** | Client offers Go's defaults (includes `X25519MLKEM768` + `X25519`) | negotiated TLS version, negotiated group (`ConnectionState.CurveID`), cipher suite, ALPN, cert chain |
| **P2 PQ-only** | `CurvePreferences = [X25519MLKEM768]`, `MinVersion = TLS1.3` | success ⇒ server supports X25519MLKEM768 |
| **P3 PQ-alt** | `CurvePreferences = [SecP256r1MLKEM768, SecP384r1MLKEM1024]` (only those the Go version supports) | success ⇒ supports other hybrids |
| **P4 TLS1.3** | `MinVersion = MaxVersion = TLS1.3` | TLS 1.3 support |
| **P5 Legacy** | `MaxVersion = TLS1.1` (allow insecure versions in this probe only) | legacy TLS still enabled (penalty) |
| **H1 HEAD** | HTTPS `HEAD /` with UA `QDayIndiaScanner/1.0 (+https://<site>/about/scanner)`, 10s timeout, no redirects followed beyond 3 | `Server`, `Strict-Transport-Security`, CDN hints (`cf-ray`, `x-akamai-*`, `x-served-by`, `x-amz-cf-id`, `via`) |

From the leaf certificate: public key algorithm and size, signature algorithm, issuer, validity dates. From the chain: signature algorithms of intermediates.

**Verify** (write tests): `cloudflare.com` must pass P2. Pick a known older-stack site that fails P2 and record it as a negative fixture. Confirm Go's `ConnectionState.CurveID` reports `X25519MLKEM768` on P1 against Cloudflare.

### 5.2 Scanner implementation (Go)

- Location: `scanner/` (Go module). **Go ≥ 1.25** (X25519MLKEM768 is enabled by default since Go 1.24; `ConnectionState.CurveID` is exposed in newer releases — verify against the installed version and pin it in `go.mod` and the workflow).
- Input: `targets/india.yaml`. Output: `data/scans/YYYY-MM-DD.json` and `data/latest.json`.
- Concurrency: max 8 hosts in parallel, 1 handshake at a time per host, 300 ms gap between probes on the same host, 10 s timeout per probe.
- Retries: 1 retry on network error; record `error` with a reason code on failure (`DNS_FAIL`, `TIMEOUT`, `TLS_FAIL`, `REFUSED`).
- Deterministic output: sort hosts and keys so diffs between weeks are readable.
- CLI: `qday-scan --targets targets/india.yaml --out data/ --date 2026-10-21` and `qday-scan --host example.in --json` (single host, used for local testing).

### 5.3 Target list

`targets/india.yaml`:

```yaml
- host: www.onlinesbi.sbi
  org: State Bank of India
  sector: banking          # banking | payments | government | stock_broking | insurance | healthcare | telecom | ecommerce | education | media
  subsector: public_bank
  shelf_life_years: 10     # default from sector if omitted
  notes: retail banking login host
```

- Seed with ~300–500 **public** hostnames across sectors (public/private banks, payment and UPI app web domains, `gov.in`/`nic.in` portals, depositories and brokers, insurers, large hospitals, telecoms, e-commerce, IITs/NITs/IIITs and central universities).
- The agent may draft the list from public knowledge, but **mark every entry `verified: false`** until the human confirms it. The website shows only verified entries.
- Sector defaults for `shelf_life_years`: banking 10, payments 7, government 25, stock_broking 10, insurance 15, healthcare 25, telecom 5, ecommerce 3, education 5, media 1.

### 5.4 Grading

**Quantum key-exchange grade (headline):**

| Grade | Rule |
|---|---|
| **A+** | P2 passes **and** P1 negotiates a PQ hybrid by default **and** legacy TLS (P5) disabled |
| **A** | P2 passes and P1 negotiates PQ hybrid; legacy TLS still enabled |
| **B** | P2 or P3 passes but P1 does not negotiate PQ by default |
| **C** | TLS 1.3 supported, no PQ hybrid |
| **D** | Max TLS 1.2 |
| **F** | TLS < 1.2 only, or invalid certificate chain |
| **—** | Unreachable (show the error, don't grade) |

**Classical hygiene flags** (shown separately, do not change the quantum grade): RSA < 2048, SHA-1 in chain, cert expiring < 14 days, no HSTS, legacy TLS enabled.

**Certificate quantum status:** always "Classical (industry-wide — PQ certificates not yet available in WebPKI)". Show the algorithm (e.g. RSA-2048, ECDSA P-256).

### 5.5 HNDL risk score (0–100)

```
exposure  = 1.0 if no PQ key exchange (grade C/D/F), 0.3 if B, 0.0 if A/A+
shelf     = clamp(shelf_life_years / 25, 0, 1)
sector_w  = { government: 1.0, healthcare: 1.0, banking: 0.9, insurance: 0.8,
              stock_broking: 0.8, payments: 0.8, telecom: 0.6, education: 0.5,
              ecommerce: 0.4, media: 0.2 }
risk      = round(100 * exposure * (0.6 * shelf + 0.4 * sector_w))
```

Display as "Harvest-Now-Decrypt-Later exposure", with a tooltip explaining the formula. Keep the formula in one function with unit tests; it must be easy to tune.

### 5.6 On-demand single-host scan (Vercel function)

Users can type any domain on the website and get a live grade.

- Route: `POST /api/scan` → `{ host }`.
- Runtime: Node.js on Vercel. **Node ≥ 24.5 (or ≥ 22.20)** bundles OpenSSL 3.5 with ML-KEM support. At startup, assert `process.versions.openssl` is ≥ 3.5; if not, return `503 { reason: "PQ_TLS_UNAVAILABLE" }` and fall back (below).
- PQ-only probe: `tls.connect({ host, servername: host, port: 443, minVersion: 'TLSv1.3', ecdhCurve: 'X25519MLKEM768' })`. Success ⇒ PQ supported. Also run a default handshake for version, cipher, cert. **Verify** both against `cloudflare.com` and the negative fixture in a test before shipping.
- **SSRF protection (mandatory):**
  - Accept only hostnames (no IPs, no ports, no paths). Validate with a strict regex + IDN → punycode.
  - Resolve DNS yourself; reject if **any** resolved address is private, loopback, link-local, CGNAT, multicast, or cloud metadata (`10/8`, `172.16/12`, `192.168/16`, `127/8`, `169.254/16`, `100.64/10`, `::1`, `fc00::/7`, `fe80::/10`, etc.). Connect to the validated IP while passing SNI = host.
  - Port 443 only. Total time budget 15 s.
- Rate limiting: per-IP token bucket (in-memory, best effort) + cache successful results with `Cache-Control: s-maxage=86400` keyed by host.
- Fallback when the runtime can't do PQ TLS: show "Live scan unavailable — request a scan" which opens a prefilled GitHub issue; a workflow (`.github/workflows/on-demand.yml`, trigger `issues: labeled scan-request`) runs the Go scanner on that host and comments the result.

### 5.7 Scheduling

`.github/workflows/weekly-scan.yml`:
- `schedule: cron: "17 3 * * 1"` (Monday 08:47 IST) + `workflow_dispatch`.
- Steps: checkout → setup-go (pinned) → build scanner → run → validate output against JSON schema → commit `data/` with message `scan: YYYY-MM-DD` → Vercel redeploys automatically on push.
- Keep the repo **public** (free unlimited Actions minutes for public repos).

### 5.8 Responsible-scanning page

`/about/scanner` must explain: what is checked (TLS handshakes + one HEAD request, weekly), what is not (no login, no crawling, no exploitation), the User-Agent string, and how a site owner can opt out (open an issue or email). Respect opt-outs via `targets/optout.txt`.

---

## 6. Module B — Code: QuantumBOM

### 6.1 Inputs

1. **Public GitHub repo URL.** In the browser:
   - `GET https://api.github.com/repos/{owner}/{repo}` → default branch.
   - `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1` → file list (one API call).
   - Fetch file contents from `https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}` (CORS-enabled; verify).
   - Optional GitHub token field for higher rate limits — held in memory only, never stored, never sent anywhere except `api.github.com`.
2. **Zip upload** (for private code): unzip in the browser with JSZip. Nothing is uploaded.
3. **Paste a single file / snippet** (quick demo mode).

Limits: skip files > 512 KB, skip `node_modules/`, `vendor/`, `dist/`, `build/`, `.git/`, minified files; cap at 3,000 files with a visible warning.

### 6.2 Engine architecture

- Package: `packages/cbom-engine` (TypeScript, no DOM dependencies) so the same engine runs in:
  - a **Web Worker** on the website,
  - the **GitHub Action** / CLI under Node.
- Parsing: **web-tree-sitter** (WASM) with grammars for JavaScript/TypeScript, Python, Java, Go, (stretch: C/C++, C#, Rust, PHP, Kotlin). Use tree-sitter queries for precise matches (call expressions, string arguments, imports). Regex fallback for unsupported languages and config files.
- Rules are **data, not code**: `packages/cbom-engine/rules/*.yaml`.

```yaml
- id: py-cryptography-rsa-generate
  language: python
  kind: treesitter              # treesitter | regex | pem | manifest
  query: |
    (call function: (attribute object: (identifier) @mod attribute: (identifier) @fn)
      (#eq? @mod "rsa") (#eq? @fn "generate_private_key"))
  algorithm: RSA
  primitive: pke                # pke | signature | kem | key-agreement | hash | symmetric | mac | kdf | rng
  quantum_risk: HIGH            # HIGH (Shor) | LOW (Grover) | NONE | CLASSICAL_BROKEN
  extract: { key_size_arg: key_size }
  fix: py-rsa-to-mlkem
```

### 6.3 What to detect (minimum rule coverage for v1)

| Area | Examples to detect |
|---|---|
| **Python** | `cryptography` (rsa, ec, dh, dsa, x25519, ed25519, hashes.MD5/SHA1), `Crypto`/`Cryptodome` (PyCryptodome), `hashlib.md5/sha1`, `ssl` context settings, `paramiko` key types, `jwt.encode(..., algorithm="RS256"/"ES256")` |
| **JavaScript/TS** | `crypto.generateKeyPair(Sync)('rsa'/'ec'/'ed25519'/'dh')`, `createSign`, `createECDH`, `createHash('md5'/'sha1')`, `crypto.subtle.generateKey({name:'RSA-OAEP'/'ECDSA'/'ECDH'})`, `node-forge`, `jsrsasign`, `elliptic`, `tweetnacl`, `jsonwebtoken` with RS*/ES*/PS* |
| **Java/Kotlin** | `KeyPairGenerator.getInstance("RSA"/"EC"/"DH")`, `Signature.getInstance("SHA256withRSA")`, `Cipher.getInstance("RSA/...")`, `KeyAgreement`, `MessageDigest.getInstance("MD5"/"SHA-1")`, BouncyCastle classes |
| **Go** | imports of `crypto/rsa`, `crypto/ecdsa`, `crypto/ed25519`, `crypto/elliptic`, `crypto/dsa`, `crypto/md5`, `crypto/sha1`; `tls.Config` with `CurvePreferences` excluding PQ groups |
| **Config / infra** | nginx `ssl_ecdh_curve`, `ssl_protocols`; Apache `SSLOpenSSLConfCmd Curves`; HAProxy `curves`; `openssl.cnf` `Groups`; Dockerfiles pinning old OpenSSL; Terraform/Kubernetes TLS policies |
| **Key material** | `.pem`, `.crt`, `.cer`, `.key`, `.pub`, `id_rsa*`, `authorized_keys`: parse with `@peculiar/x509` / `pkijs` to get algorithm and size. **Never display private key contents** — report only "private key file found (RSA-2048) — remove from repo". |
| **Manifests** | `package.json`, `requirements.txt`, `pyproject.toml`, `pom.xml`, `build.gradle`, `go.mod`: flag crypto libraries and note versions that support PQC where known |

Every finding records `{ ruleId, file, line, column, snippet (max 3 lines), algorithm, keySize?, primitive, quantumRisk, confidence (high|medium|low) }`.

### 6.4 Fix suggestions

`packages/cbom-engine/fixes/*.md` keyed by `fix` id. Each fix gives: why, the PQ replacement, a before/after snippet, and caveats. Examples:

- **TLS servers**: nginx built against OpenSSL ≥ 3.5 → `ssl_ecdh_curve X25519MLKEM768:X25519;` and `ssl_protocols TLSv1.3 TLSv1.2;`.
- **Go**: PQ hybrid is default from Go 1.24 — remove any `CurvePreferences` that exclude `tls.X25519MLKEM768`.
- **Node.js**: Node with OpenSSL 3.5 — `ecdhCurve: 'X25519MLKEM768:X25519'`.
- **Java**: JDK 24+ includes ML-KEM and ML-DSA (JEPs 496/497) — show `KeyPairGenerator.getInstance("ML-KEM")`.
- **Python**: recommend a maintained PQC binding (e.g. liboqs-python) — **verify current library status before writing the snippet**.
- **Signatures/JWT**: plan for ML-DSA; for now, crypto-agility (algorithm configurable, not hardcoded).
- **Hashes**: MD5/SHA-1 → SHA-256/SHA-3. **Symmetric**: AES-128 → AES-256.

Mark every fix with the date it was last verified.

### 6.5 Scores for a repo

- **Quantum Exposure** (0–100): weighted count of HIGH findings by primitive (key-agreement/KEM and long-term signatures weigh most), normalised by repo size with a log curve.
- **Crypto-Agility** (0–100): higher when algorithms come from config/constants in one place, lower when the same algorithm string is hardcoded across many files. Heuristic: number of distinct files containing hardcoded algorithm identifiers ÷ total crypto findings.
- Show both as gauges, with the inputs listed so the score is explainable.

### 6.6 CBOM output (CycloneDX 1.6)

Export `quantumbom.cdx.json`:
- `bomFormat: "CycloneDX"`, `specVersion: "1.6"`.
- One `component` per distinct algorithm/key/certificate, `type: "cryptographic-asset"`, with `cryptoProperties` (`assetType`, `algorithmProperties.primitive`, `parameterSetIdentifier`, `nistQuantumSecurityLevel` — 0 for RSA/ECC/DH, the ML-KEM/ML-DSA level for PQ algorithms).
- Locations as `evidence.occurrences` (file + line).
- **Validate** against the official CycloneDX 1.6 JSON schema with `ajv` in tests. Invalid output must fail CI.

Also export **SARIF 2.1.0** (`quantumbom.sarif`) so findings show up in GitHub Code Scanning, and **Markdown** (human report).

---

## 7. Glue features — where the merge pays off

1. **Organisation report** (`/org`): enter a domain *and* a repo (or zip) → one combined page: TLS grade + code findings + CBOM + a prioritised migration plan (fix public TLS first, then key exchange in code, then signatures, then hashes). Map each item to the DST roadmap phase it relates to.
2. **Q-Day Calculator** (`/qday`): Mosca's inequality with three sliders (shelf life X, migration time Y, CRQC estimate Z). Pre-fill X from the sector and Y from the repo's finding count (heuristic, labelled as such). Big visual: "You are N years late" / "You have N years of margin".
3. **README badge**: `GET /api/badge?host=example.in` (and `?repo=owner/name` for Action-produced results) returns an SVG like `quantum-safe TLS: A`. Served from cached scan data; edge function, no per-request scanning.
4. **GitHub Action** (`action/`): `uses: <owner>/qday-india/action@v1` runs `cbom-engine` on the checked-out repo, uploads SARIF to Code Scanning, uploads the CBOM as an artifact, and optionally fails the build above an exposure threshold. Dogfood it on this repo.
5. **State of the Nation report** (`/report/2026-10`): auto-generated monthly from `data/scans/` — % A/A+ by sector, biggest movers, CDN effect (e.g. share of PQ-ready sites behind a CDN vs self-hosted), legacy-TLS stragglers. Charts + plain-language summary. This is the media-friendly page.
6. **Share without a backend**: code reports are compressed (`lz-string`) into the URL **fragment** (`#r=...`), which browsers never send to servers. If too large (> ~30 KB), offer a JSON download instead.

---

## 8. Website — pages and UX

| Route | Content |
|---|---|
| `/` | Hero: tagline + two big inputs ("Check a website" / "Scan your code"). Live stat strip from `latest.json` (e.g. "X% of tracked Indian sites use quantum-safe key exchange"). Sector bar chart. |
| `/index` | Quantum Readiness Index table: search, filter by sector and grade, sort by HNDL risk; sparkline of each site's grade history. |
| `/site/[host]` | Per-site report: grade, probes, cert info, hygiene flags, HNDL risk, history chart, fix guidance for the site owner, badge embed code. |
| `/code` | QuantumBOM: input tabs (GitHub URL / zip / paste) → progress (files parsed, findings) → results: gauges, findings grouped by risk and file, inline snippets, fix panels; export CBOM/SARIF/Markdown; Share. |
| `/org` | Combined report (Section 7.1). |
| `/qday` | Mosca calculator. |
| `/report/[month]` | State of the Nation. |
| `/learn` | Primer from Section 3, written for a non-expert, with one simple animated diagram of HNDL. |
| `/about/scanner` | Responsible scanning + opt-out. |
| `/about` | Methodology, scoring formulas, limitations, sources. |

**Design direction**: serious, trustworthy, data-journalism feel (think a security research lab report, not a hacker theme). Dark and light mode. One accent colour for "quantum-safe" (e.g. teal) and one for "exposed" (amber — avoid alarmist red except for F). Grades as large letter chips. Mobile-friendly; the index table becomes cards on small screens. Accessible: WCAG AA contrast, keyboard navigable, charts have text alternatives.

**Language**: English first; structure strings for later Hindi/Bengali translation (`next-intl` or similar).

---

## 9. Tech stack and repo layout

```
qday-india/
├─ apps/web/                 # Next.js (App Router, TypeScript), Tailwind, shadcn/ui, Recharts
│  ├─ app/                   # routes from Section 8
│  ├─ app/api/scan/route.ts  # on-demand scan (Node runtime)
│  ├─ app/api/badge/route.ts # SVG badge (edge)
│  └─ workers/quantumbom.worker.ts
├─ packages/cbom-engine/     # TS engine: parsers, rules, fixes, scoring, CBOM/SARIF exporters
│  ├─ rules/*.yaml
│  ├─ fixes/*.md
│  └─ test/fixtures/         # small fake repos with known findings
├─ scanner/                  # Go TLS scanner
├─ action/                   # GitHub Action wrapping cbom-engine
├─ targets/india.yaml
├─ targets/optout.txt
├─ data/latest.json
├─ data/scans/YYYY-MM-DD.json
├─ schemas/scan.schema.json  # JSON Schema for scanner output
├─ .github/workflows/{ci,weekly-scan,on-demand}.yml
├─ PROJECT_SPEC.md  CHANGELOG.md  DECISIONS.md  README.md
```

- Package manager: pnpm workspaces.
- Testing: Vitest (TS), `go test` (scanner), Playwright **not** used (no Chromium) — use Vitest + Testing Library for UI logic.
- Lint/format: ESLint, Prettier, `gofmt`, `go vet`.
- Hosting: Vercel Hobby (root `apps/web`). Pin the Node version in `package.json` `engines` and Vercel settings to one that bundles OpenSSL ≥ 3.5.

---

## 10. Data contracts

### 10.1 Scanner output (`data/scans/*.json`, `data/latest.json`)

```ts
type ScanFile = {
  scannedAt: string;            // ISO 8601
  scannerVersion: string;
  goVersion: string;
  results: SiteResult[];
};

type SiteResult = {
  host: string;
  org: string;
  sector: Sector;
  reachable: boolean;
  error?: { code: 'DNS_FAIL' | 'TIMEOUT' | 'TLS_FAIL' | 'REFUSED'; detail: string };
  tls?: {
    maxVersion: 'TLS1.3' | 'TLS1.2' | 'TLS1.1' | 'TLS1.0';
    defaultGroup: string;       // e.g. "X25519MLKEM768" | "X25519" | "P-256"
    pqHybrid: { x25519mlkem768: boolean; secp256r1mlkem768?: boolean; secp384r1mlkem1024?: boolean };
    legacyEnabled: boolean;
    cipherSuite: string;
    alpn?: string;
  };
  cert?: {
    keyAlgorithm: 'RSA' | 'ECDSA' | 'Ed25519' | string;
    keySize: number;
    signatureAlgorithm: string;
    issuer: string;
    notAfter: string;
    chainSignatureAlgorithms: string[];
  };
  http?: { hsts: boolean; server?: string; cdn?: 'cloudflare' | 'akamai' | 'fastly' | 'cloudfront' | 'other' | null };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' | null;
  hygieneFlags: string[];
  hndlRisk: number;             // 0-100
};
```

### 10.2 Code findings (engine output)

```ts
type Finding = {
  ruleId: string;
  file: string; line: number; column: number;
  snippet: string;
  algorithm: string; keySize?: number;
  primitive: 'pke' | 'signature' | 'kem' | 'key-agreement' | 'hash' | 'symmetric' | 'mac' | 'kdf' | 'rng';
  quantumRisk: 'HIGH' | 'LOW' | 'NONE' | 'CLASSICAL_BROKEN';
  confidence: 'high' | 'medium' | 'low';
  fixId?: string;
};
```

### 10.3 Wording rules (enforce in UI copy and reports)

- ✅ "uses quantum-safe key exchange", "not yet quantum-safe", "exposed to harvest-now-decrypt-later", "migration recommended".
- ❌ "vulnerable", "insecure", "hackable", "breached", "failing", "shame".
- Always pair a low grade with a fix.
- Always show the scan date next to any grade.

---

## 11. Testing and validation

- **Scanner**: unit tests for grading and HNDL; integration tests (behind a flag) against `cloudflare.com` (expect PQ) and one negative fixture; schema validation of output in CI.
- **On-demand API**: SSRF tests (private IPs, `localhost`, DNS rebinding to a private IP, IP literals, ports) must all be rejected.
- **Engine**: fixture repos under `packages/cbom-engine/test/fixtures/` (one per language + one config/infra fixture + one PEM fixture) with an expected findings JSON — snapshot tests. Target ≥ 90% precision on fixtures; no private-key contents in any output.
- **CBOM**: ajv validation against CycloneDX 1.6 schema. **SARIF**: validate against the SARIF 2.1.0 schema.
- **Performance**: scan a 1,000-file repo in the browser in < 60 s on a mid-range laptop; the UI must stay responsive (all parsing in the worker; stream progress).
- **Accessibility**: automated axe checks in Vitest/JSdom for main pages.

---

## 12. Milestones (build all of them, in this order, without pausing)

### M1 — Scanner core
- Go scanner with probes P1–P5 + H1, grading, HNDL, JSON output, schema.
- 20-host seed list across sectors (marked `verified: false`).
- **Done when**: `qday-scan --host cloudflare.com --json` shows `x25519mlkem768: true`, grade A or A+; tests pass; output validates.

### M2 — Weekly pipeline + Index UI
- `weekly-scan.yml` committing to `data/`.
- Next.js app: `/`, `/index`, `/site/[host]`, `/about/scanner`, `/about`.
- **Done when**: pushing data triggers a Vercel deploy and the index renders real data, filtered and sorted.

### M3 — CBOM engine (Python + JS/TS + config + PEM)
- Engine package, rules for Python, JS/TS, nginx/Apache/OpenSSL config, PEM/keys.
- CycloneDX 1.6 + SARIF + Markdown exporters with schema validation.
- **Done when**: fixtures produce expected findings and valid CBOM/SARIF.

### M4 — `/code` page
- Web Worker, GitHub URL / zip / paste inputs, progress, results, fix panels, exports, URL-fragment share.
- **Done when**: scanning a public repo end-to-end works in the browser with no network calls except GitHub.

### M5 — Java + Go rules, scores
- Rules for Java/Kotlin and Go; Quantum Exposure + Crypto-Agility scores.

### M6 — On-demand scan + badge
- `/api/scan` with SSRF protection and caching; issue-based fallback workflow; `/api/badge`.
- **Done when**: SSRF test suite passes; a live scan of a new domain returns in < 15 s.

### M7 — Glue features
- `/org`, `/qday`, monthly `/report/[month]` generator, `/learn`.

### M8 — GitHub Action + launch polish
- `action/` published, dogfooded on this repo (badge in README).
- Expand `targets/india.yaml` to 300–500 hosts (all `verified: false`; the human verifies after the build).
- README with screenshots, methodology, limitations, sources; Lighthouse ≥ 90 on `/` and `/index`.

### Stretch
- Hindi and Bengali UI.
- More languages in the engine (C/C++, C#, Rust, PHP).
- Quantum explainer: tiny in-browser simulation showing why Shor factors 15.
- Mobile-app (APK) crypto scan in the browser.
- Per-sector email digest for site owners (opt-in).

---

## 13. Limitations to state openly on `/about`

- TLS checks see only the public edge (often a CDN), not internal or back-end connections.
- Certificates cannot be PQ yet; grades reflect key exchange only.
- Static code analysis has false positives and misses dynamic crypto (algorithm names built at runtime). Confidence levels are shown.
- CRQC timelines are uncertain; the Q-Day calculator lets users choose their own estimate.

---

## 14. Demo script (for presentations)

1. Open `/` — show the headline stat about tracked Indian sites and the sector chart.
2. Type a well-known Indian bank or government domain → live grade + HNDL score + what to fix.
3. Switch to `/code`, paste a public repo URL → watch findings stream in → open an RSA finding → show the fix → export the CBOM.
4. Open `/qday` → move the shelf-life slider for "government data, 25 years" → "You are N years late".
5. Show the README badge and the GitHub Action annotating a pull request.
6. End on `/report/<latest>` — "This is India's quantum readiness, updated every week, for ₹0."

---

## 15. References (verify links during build)

- DST Task Force, *Implementation of Quantum Safe Ecosystem in India* (Feb 2026): https://dst.gov.in/sites/default/files/Report_TaskForce_PQMigration_4Feb26%20%28v1%29.pdf
- NIST FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA): https://csrc.nist.gov/pubs/fips/203/final · /204/final · /205/final
- IETF hybrid ML-KEM for TLS: https://datatracker.ietf.org/doc/draft-ietf-tls-ecdhe-mlkem/
- OpenSSL 3.5 release (ML-KEM, default X25519MLKEM768 keyshare): https://github.com/openssl/openssl/releases
- Go `crypto/tls` X25519MLKEM768 (Go 1.24+): https://github.com/golang/go/issues/69985
- Cloudflare PQC support matrix (Node.js 24.5+ via OpenSSL 3.5, etc.): https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/
- CycloneDX 1.6 (CBOM): https://cyclonedx.org/docs/1.6/json/
- SARIF 2.1.0: https://docs.oasis-open.org/sarif/sarif/v2.1.0/
