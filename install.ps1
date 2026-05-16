# Go Markdown - File Association Install Script
# Run: .\install.ps1           (install)
# Run: .\install.ps1 -Uninstall (remove associations)
param([switch]$Uninstall)

$ErrorActionPreference = "Stop"
$AppName = "GoMarkdown"
$ProgID  = "GoMarkdown.md"

# Try to find the executable — check script directory first, then build output
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePaths  = @(
    "$scriptDir\go-markdown.exe",
    "$scriptDir\bin\go-markdown.exe",
    "$PSScriptRoot\go-markdown.exe",
    "$PSScriptRoot\bin\go-markdown.exe"
)
$ExePath = $null
foreach ($p in $exePaths) {
    if (Test-Path $p) { $ExePath = (Resolve-Path $p).Path; break }
}

if (-not $ExePath) {
    Write-Host "Could not find go-markdown.exe." -ForegroundColor Red
    Write-Host "Please place this script next to go-markdown.exe or in the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Go Markdown: $ExePath" -ForegroundColor Cyan

$extensions = @(".md", ".markdown", ".mdown", ".mkd")

if ($Uninstall) {
    Write-Host ""
    Write-Host "Removing file associations..." -ForegroundColor Yellow
    foreach ($ext in $extensions) {
        Remove-Item "HKCU:\Software\Classes\$ext" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  $ext  — removed" -ForegroundColor Gray
    }
    Remove-Item "HKCU:\Software\Classes\$ProgID" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  $ProgID  — removed" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Go Markdown file associations have been removed." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Registering file associations..." -ForegroundColor Cyan

# Create ProgID entry
$progPath = "HKCU:\Software\Classes\$ProgID"
New-Item -Path $progPath -Force | Out-Null
Set-ItemProperty -Path $progPath -Name "(Default)" -Value "Markdown Document" -Type String

# Set icon (use the exe's first icon)
$iconPath = "$progPath\DefaultIcon"
New-Item -Path $iconPath -Force | Out-Null
Set-ItemProperty -Path $iconPath -Name "(Default)" -Value """$ExePath"",0" -Type String

# Set open command
$cmdPath = "$progPath\shell\open\command"
New-Item -Path $cmdPath -Force | Out-Null
Set-ItemProperty -Path $cmdPath -Name "(Default)" -Value """$ExePath"" ""%1""" -Type String

Write-Host "  ProgID: $ProgID → $ExePath" -ForegroundColor Gray

# Associate each extension
foreach ($ext in $extensions) {
    $extPath = "HKCU:\Software\Classes\$ext"
    New-Item -Path $extPath -Force | Out-Null
    Set-ItemProperty -Path $extPath -Name "(Default)" -Value $ProgID -Type String
    Write-Host "  $ext  → $ProgID" -ForegroundColor Gray
}

# Notify the shell that file associations have changed
$null = (New-Object -ComObject Shell.Application).NameSpace(0x11).Self.InvokeVerb("")

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Go Markdown is now the default" -ForegroundColor Green
Write-Host "  Markdown file opener!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Supported extensions: $($extensions -join ', ')" -ForegroundColor Gray
Write-Host "Double-click any .md file to open it with Go Markdown." -ForegroundColor Gray
Write-Host ""
Write-Host "To uninstall: .\install.ps1 -Uninstall" -ForegroundColor DarkGray
