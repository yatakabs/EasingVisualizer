#!/usr/bin/env pwsh
# Run Playwright tests with automatic port detection

param(
    [int]$Port = 5004
)

$env:PLAYWRIGHT_BASE_URL = "http://localhost:$Port"
Write-Host "Running Playwright tests against $env:PLAYWRIGHT_BASE_URL"

npx playwright test --timeout=60000
