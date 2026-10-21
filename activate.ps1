# Project-local "virtual environment": every toolchain, cache and temp dir lives in .\.venv (D: drive).
# Usage: . .\activate.ps1
$V = Join-Path $PSScriptRoot '.venv'
$env:GOROOT = "$V\go"; $env:GOPATH = "$V\gopath"; $env:GOCACHE = "$V\gocache"; $env:GOMODCACHE = "$V\gopath\pkg\mod"; $env:GOTOOLCHAIN = 'local'
$env:npm_config_cache = "$V\npm-cache"; $env:npm_config_store_dir = "$V\pnpm-store"; $env:PNPM_HOME = "$V\pnpm-home"
$env:XDG_CACHE_HOME = "$V\cache"; $env:XDG_DATA_HOME = "$V\data"; $env:XDG_STATE_HOME = "$V\state"; $env:XDG_CONFIG_HOME = "$V\config"
$env:TMP = "$V\tmp"; $env:TEMP = "$V\tmp"; $env:NEXT_TELEMETRY_DISABLED = '1'
$env:PATH = "$V\go\bin;$V\gopath\bin;$V\bin\node_modules\.bin;$env:PNPM_HOME;$env:PATH"
foreach ($d in 'tmp','cache','data','state','config') { New-Item -ItemType Directory -Force (Join-Path $V $d) | Out-Null }
