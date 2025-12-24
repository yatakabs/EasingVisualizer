<#
.SYNOPSIS
    Deploy Wiki content to GitHub Wiki repository.

.DESCRIPTION
    This script clones the GitHub Wiki repository, copies the wiki source files
    from wiki/, and pushes the changes to the wiki repository.

.PARAMETER WikiRepoUrl
    The git clone URL for the wiki repository.
    Default: https://github.com/yatakabs/EasingVisualizer.wiki.git

.PARAMETER CommitMessage
    The commit message for the wiki update.
    Default: "Update wiki content"

.PARAMETER DryRun
    If specified, shows what would be done without making changes.

.EXAMPLE
    ./scripts/deploy-wiki.ps1
    
    Deploy wiki content with default settings.

.EXAMPLE
    ./scripts/deploy-wiki.ps1 -CommitMessage "docs: add FAQ section"
    
    Deploy with a custom commit message.

.EXAMPLE
    ./scripts/deploy-wiki.ps1 -DryRun
    
    Preview what would be deployed without making changes.

.NOTES
    Prerequisites:
    - Wiki must be enabled in repository settings
    - Wiki must be initialized (create first page via GitHub web UI)
    - Git must be installed and configured with push access
#>

param(
    [string]$WikiRepoUrl = "https://github.com/yatakabs/EasingVisualizer.wiki.git",
    [string]$CommitMessage = "Update wiki content",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Configuration
$TempDir = ".temp/wiki-deploy"
$WikiSourceDir = "wiki"
$ExcludeFiles = @("README.md")  # Files to exclude from deployment

# Colors for output
function Write-Step { param($Message) Write-Host "→ $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }

# Banner
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║           Easing Visualizer Wiki Deployment              ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

if ($DryRun) {
    Write-Warning "DRY RUN MODE - No changes will be made"
    Write-Host ""
}

# Verify we're in the repository root
if (-not (Test-Path $WikiSourceDir)) {
    Write-Error "Wiki source directory not found: $WikiSourceDir"
    Write-Host "Please run this script from the repository root." -ForegroundColor Gray
    exit 1
}

# Count source files
$SourceFiles = Get-ChildItem -Path $WikiSourceDir -Filter "*.md" | 
    Where-Object { $_.Name -notin $ExcludeFiles }
$FileCount = $SourceFiles.Count

Write-Step "Found $FileCount wiki files to deploy"
$SourceFiles | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Gray }
Write-Host ""

if ($DryRun) {
    Write-Success "Dry run complete. Would deploy $FileCount files."
    exit 0
}

# Clean up any existing temp directory
if (Test-Path $TempDir) {
    Write-Step "Cleaning up existing temp directory..."
    Remove-Item -Path $TempDir -Recurse -Force
}

# Create temp directory
$null = New-Item -Path $TempDir -ItemType Directory -Force

try {
    # Clone wiki repository
    Write-Step "Cloning wiki repository..."
    git clone --depth 1 $WikiRepoUrl $TempDir 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to clone wiki repository"
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  1. Wiki is not enabled in repository settings" -ForegroundColor Gray
        Write-Host "  2. Wiki has not been initialized (create first page via GitHub UI)" -ForegroundColor Gray
        Write-Host "  3. No network access or authentication issues" -ForegroundColor Gray
        exit 1
    }
    Write-Success "Wiki repository cloned"

    # Copy files
    Write-Step "Copying wiki files..."
    $CopiedCount = 0
    foreach ($File in $SourceFiles) {
        $DestPath = Join-Path $TempDir $File.Name
        Copy-Item -Path $File.FullName -Destination $DestPath -Force
        $CopiedCount++
        Write-Host "   Copied: $($File.Name)" -ForegroundColor Gray
    }
    Write-Success "Copied $CopiedCount files"

    # Check for changes
    Write-Step "Checking for changes..."
    Push-Location $TempDir
    try {
        $Status = git status --porcelain
        
        if (-not $Status) {
            Write-Warning "No changes detected. Wiki is already up to date."
            exit 0
        }

        # Show what changed
        Write-Host "   Changes detected:" -ForegroundColor Gray
        $Status -split "`n" | ForEach-Object {
            if ($_ -match "^\s*M\s+(.+)$") {
                Write-Host "   Modified: $($Matches[1])" -ForegroundColor Yellow
            }
            elseif ($_ -match "^\s*A\s+(.+)$" -or $_ -match "^\?\?\s+(.+)$") {
                Write-Host "   Added: $($Matches[1])" -ForegroundColor Green
            }
            elseif ($_ -match "^\s*D\s+(.+)$") {
                Write-Host "   Deleted: $($Matches[1])" -ForegroundColor Red
            }
        }
        Write-Host ""

        # Stage all changes
        Write-Step "Staging changes..."
        git add -A
        Write-Success "Changes staged"

        # Commit
        Write-Step "Committing changes..."
        git commit -m $CommitMessage 2>&1 | Out-Null
        Write-Success "Changes committed: $CommitMessage"

        # Push
        Write-Step "Pushing to wiki repository..."
        git push origin HEAD 2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to push changes"
            Write-Host "Check your git credentials and repository permissions." -ForegroundColor Gray
            exit 1
        }
        Write-Success "Changes pushed successfully"

    }
    finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              Wiki deployment complete!                   ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "View your wiki at:" -ForegroundColor Gray
    Write-Host "  https://github.com/yatakabs/EasingVisualizer/wiki" -ForegroundColor Cyan
    Write-Host ""

}
finally {
    # Cleanup
    if (Test-Path $TempDir) {
        Write-Step "Cleaning up..."
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
