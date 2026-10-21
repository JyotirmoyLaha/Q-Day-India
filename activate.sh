# Project-local "virtual environment": every toolchain, cache and temp dir lives in ./.venv (D: drive).
# Usage: source ./activate.sh
QDAY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
V="$QDAY_ROOT/.venv"
export GOROOT="$V/go" GOPATH="$V/gopath" GOCACHE="$V/gocache" GOMODCACHE="$V/gopath/pkg/mod" GOTOOLCHAIN=local
export npm_config_cache="$V/npm-cache" npm_config_store_dir="$V/pnpm-store" PNPM_HOME="$V/pnpm-home"
export XDG_CACHE_HOME="$V/cache" XDG_DATA_HOME="$V/data" XDG_STATE_HOME="$V/state" XDG_CONFIG_HOME="$V/config"
export TMP="$V/tmp" TEMP="$V/tmp" TMPDIR="$V/tmp" NEXT_TELEMETRY_DISABLED=1
# Tools that write into the Windows profile (Go telemetry, Node compile cache) are redirected too.
export APPDATA="$V/appdata/roaming" LOCALAPPDATA="$V/appdata/local" NODE_COMPILE_CACHE="$V/cache/node-compile"
export PATH="$V/go/bin:$V/gopath/bin:$V/bin/node_modules/.bin:$PNPM_HOME:$PATH"
mkdir -p "$V/tmp" "$V/cache" "$V/data" "$V/state" "$V/config" "$V/appdata/roaming" "$V/appdata/local"
