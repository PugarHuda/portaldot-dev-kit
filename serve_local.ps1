# serve_local.ps1 — emergency local-serve for the showcase deck
#
# Why this exists: Vercel free tier caps at 100 deploys/day. If the canonical
# https://portaldot-pdk.vercel.app/slide isn't live, run this and the deck
# (with the embedded live-demo video) opens against a tiny local server.
# No internet required after this point.
#
# Usage (from project root):
#   .\serve_local.ps1
#
# Stops with Ctrl+C. Opens the deck in default browser.

$ErrorActionPreference = 'Stop'
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = Join-Path $here 'web'
$port   = 8000

if (-not (Test-Path (Join-Path $webDir 'slide\index.html'))) {
  Write-Host "FATAL: web/slide/index.html not found at $webDir" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path (Join-Path $webDir 'live-demo.mp4'))) {
  Write-Host "FATAL: web/live-demo.mp4 not found - the embedded video will 404" -ForegroundColor Red
  exit 1
}

$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { $python = (Get-Command py -ErrorAction SilentlyContinue).Source }
if (-not $python) {
  Write-Host "FATAL: no python on PATH. Install Python 3 or use the Vercel/Cloudflare URL." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "==== showcase deck: local serve ====" -ForegroundColor Green
Write-Host "  serving   : $webDir"
Write-Host "  port      : $port"
Write-Host "  deck URL  : http://localhost:$port/slide/"
Write-Host "  video URL : http://localhost:$port/live-demo.mp4"
Write-Host "  stop      : Ctrl+C in this window"
Write-Host ""

Start-Process "http://localhost:$port/slide/" | Out-Null

Push-Location $webDir
try {
  & $python -m http.server $port --bind 127.0.0.1
} finally {
  Pop-Location
}
