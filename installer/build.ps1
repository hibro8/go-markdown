# Build Go Markdown + NSIS Installer
# Requirements: Node.js 20+, Go 1.23+, NSIS 3.x (C:\Program Files (x86)\NSIS)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== 1/4 Building frontend ===" -ForegroundColor Cyan
Push-Location "$root\frontend"
npm run build
Pop-Location

Write-Host "=== 2/4 Building Go binary ===" -ForegroundColor Cyan
Push-Location "$root"
go build -ldflags="-H windowsgui -s -w" -o bin/go-markdown.exe
Pop-Location

Write-Host "=== 3/4 Building NSIS installer ===" -ForegroundColor Cyan
$makensis = "C:\Program Files (x86)\NSIS\makensis.exe"
if (-not (Test-Path $makensis)) {
    Write-Error "NSIS not found at $makensis. Install NSIS 3.x first."
    exit 1
}
Push-Location "$root\installer"
& $makensis go-markdown.nsi
Pop-Location

Write-Host "=== 4/4 Done ===" -ForegroundColor Green
$setup = Get-Item "$root\bin\GoMarkdown-Setup.exe"
Write-Host "Installer: $($setup.FullName) ($('{0:N1}' -f ($setup.Length / 1MB)) MB)"
