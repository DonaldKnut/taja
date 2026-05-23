# PowerShell script to fix "found an existing package already installed" issue

Write-Host "🔧 Fixing package installation issues..." -ForegroundColor Cyan

# Step 1: Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "📦 Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules not found, skipping..." -ForegroundColor Gray
}

# Step 2: Remove package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "📄 Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  package-lock.json not found, skipping..." -ForegroundColor Gray
}

# Step 3: Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✅ npm cache cleared" -ForegroundColor Green

# Step 4: Fresh install
Write-Host "📥 Installing packages fresh..." -ForegroundColor Yellow
npm install

Write-Host "`n✨ Done! Packages should be installed correctly now." -ForegroundColor Green
Write-Host "💡 If issues persist, try: npm install --force" -ForegroundColor Cyan









