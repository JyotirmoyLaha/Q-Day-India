# Decisions log

Each entry: what the spec said or left open, what was chosen, and why.

1. **Project-local toolchain (`.venv/`).** The owner asked for a virtual environment and to keep the C: drive clean. Go 1.27.3 (portable zip, SHA-256 verified), pnpm 10.34 and every cache (Go build/module cache, npm cache, pnpm store, XDG dirs, TEMP) live in `.venv/`, activated with `source ./activate.sh` (bash) or `. .\activate.ps1` (PowerShell). `.venv/` is git-ignored. CI uses the normal `setup-go` / `pnpm/action-setup` actions instead.
2. **Unverified hosts are shown, not hidden.** §5.3 says "the website shows only verified entries", but §0 says to show unverified entries with an "unverified" tag so the product is complete. §0 wins. Unverified entries carry a visible `unverified` tag everywhere. To switch to "verified only" later, set `NEXT_PUBLIC_SHOW_UNVERIFIED=0`.
3. **Go version.** go.mod pins `go 1.26` because P3 needs `tls.SecP256r1MLKEM768` / `tls.SecP384r1MLKEM1024`, which were added in Go 1.26 (X25519MLKEM768 and `ConnectionState.CurveID` came earlier). Developed and tested with Go 1.27.3. The workflows use `go-version-file: scanner/go.mod`.
4. **TypeScript 5.9.** TypeScript 7.0 (the native port) is the npm `latest`, but typescript-eslint supports only `<6.1`, so TS is pinned to 5.9.3.
5. **pnpm 10** is used instead of pnpm 12 (the npm `latest`) for wider compatibility with Vercel and `pnpm/action-setup`. It's pinned through `packageManager` in the root `package.json`.
