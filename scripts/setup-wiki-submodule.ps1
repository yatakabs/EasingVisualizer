<#
.SYNOPSIS
    Set up the wiki as a git submodule.

.DESCRIPTION
    This script converts the wiki/ directory to a git submodule.
    Prerequisites:
    - Wiki must be enabled in GitHub repository settings
    - Wiki must be initialized (create first page via GitHub web UI)

.PARAMETER Force
    Remove existing wiki/ directory content before adding submodule.

.EXAMPLE
    ./scripts/setup-wiki-submodule.ps1

    Set up wiki submodule (will fail if wiki/ exists with content).

.EXAMPLE
    ./scripts/setup-wiki-submodule.ps1 -Force

    Force setup by removing existing wiki/ content first.

.NOTES
    After running this script:
    1. Push the content from .temp/wiki-content/ to the wiki repo
    2. Run: git submodule update --init --recursive
#>

param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$WikiRepoUrl = "https://github.com/yatakabs/EasingVisualizer.wiki.git"
$WikiPath = "wiki"
$BackupPath = ".temp/wiki-content"

# Colors for output
function Write-Step { param($Message) Write-Host "→ $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║           Wiki Submodule Setup                           ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if wiki directory exists with content
if (Test-Path $WikiPath) {
    if ($Force) {
        Write-Step "Backing up existing wiki content..."
        if (!(Test-Path $BackupPath)) {
            New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
        }
        Copy-Item -Path "$WikiPath/*" -Destination $BackupPath -Recurse -Force
        Write-Success "Content backed up to $BackupPath"

        Write-Step "Removing existing wiki directory..."
        Remove-Item -Path $WikiPath -Recurse -Force
        Write-Success "Directory removed"
    } else {
        Write-Error "wiki/ directory already exists. Use -Force to remove and replace."
        Write-Host "  Existing content will be backed up to $BackupPath" -ForegroundColor Gray
        exit 1
    }
}

# Test if wiki repo is accessible
Write-Step "Testing wiki repository access..."
$TestResult = git ls-remote $WikiRepoUrl 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Wiki repository not found or not accessible"
    Write-Host ""
    Write-Host "To fix this:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://github.com/yatakabs/EasingVisualizer/settings" -ForegroundColor Gray
    Write-Host "  2. Under 'Features', enable 'Wikis'" -ForegroundColor Gray
    Write-Host "  3. Go to: https://github.com/yatakabs/EasingVisualizer/wiki" -ForegroundColor Gray
    Write-Host "  4. Click 'Create the first page' and save" -ForegroundColor Gray
    Write-Host "  5. Re-run this script" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Wiki content is saved in: $BackupPath" -ForegroundColor Cyan
    exit 1
}
Write-Success "Wiki repository is accessible"

# Add submodule
Write-Step "Adding wiki as submodule..."
git submodule add $WikiRepoUrl $WikiPath 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to add submodule"
    exit 1
}
Write-Success "Submodule added successfully"

# Initialize and update
Write-Step "Initializing submodule..."
git submodule update --init --recursive

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           Wiki submodule setup complete!                 ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if (Test-Path $BackupPath) {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Copy content from $BackupPath to wiki/" -ForegroundColor Gray
    Write-Host "  2. cd wiki && git add . && git commit -m 'Initial wiki content'" -ForegroundColor Gray
    Write-Host "  3. git push origin master" -ForegroundColor Gray
    Write-Host "  4. cd .. && git add wiki .gitmodules && git commit" -ForegroundColor Gray
    Write-Host ""
}
