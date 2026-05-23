# Clean Development Environment Script
# Run this script when experiencing ChunkLoadError or build issues

Write-Host "Cleaning Next.js development environment..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host ""
Write-Host "1. Stopping Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clear Next.js cache
Write-Host "2. Clearing .next folder..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "   [OK] .next folder deleted" -ForegroundColor Green
} else {
    Write-Host "   [OK] .next folder not found" -ForegroundColor Gray
}

# Clear node_modules cache
Write-Host "3. Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "   [OK] node_modules cache cleared" -ForegroundColor Green
} else {
    Write-Host "   [OK] No node_modules cache found" -ForegroundColor Gray
}

# Check port 3000
Write-Host "4. Checking port 3000..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr :3000
if ($portCheck) {
    Write-Host "   [WARNING] Port 3000 is still in use. Please close any applications using it." -ForegroundColor Red
} else {
    Write-Host "   [OK] Port 3000 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "[SUCCESS] Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Hard refresh the browser (Ctrl+Shift+R)" -ForegroundColor White
