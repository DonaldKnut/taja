# Fix ChunkLoadError - Complete Guide

## Quick Fix (When Error Occurs)

1. **Run the cleanup script:**
   ```powershell
   .\clean-dev.ps1
   ```

2. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Clear data

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Hard refresh browser:**
   - Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)

## Permanent Solutions

### Option 1: Use the Cleanup Script
Run `.\clean-dev.ps1` whenever you encounter the error.

### Option 2: Manual Cleanup
```powershell
# Stop all Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Clear Next.js cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Clear node_modules cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Restart dev server
npm run dev
```

### Option 3: Add to package.json
Add this script to your `package.json`:
```json
"scripts": {
  "clean": "powershell -ExecutionPolicy Bypass -File ./clean-dev.ps1",
  "dev:clean": "npm run clean && npm run dev"
}
```

Then run: `npm run dev:clean`

## Why This Happens

ChunkLoadError occurs when:
- Build cache gets corrupted
- Multiple dev servers are running
- Browser cache conflicts with new chunks
- File system watching issues (common on Windows)
- Port conflicts

## Prevention Tips

1. **Always stop the dev server properly** (Ctrl+C) before restarting
2. **Clear browser cache** if you see persistent errors
3. **Don't run multiple dev servers** on the same port
4. **Use the cleanup script** before major changes
5. **Keep Next.js updated** to latest stable version

## If Error Persists

1. Delete `node_modules` and reinstall:
   ```bash
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. Check for port conflicts:
   ```bash
   netstat -ano | findstr :3000
   ```

3. Try a different port:
   ```bash
   npm run dev -- -p 3001
   ```

4. Update Next.js:
   ```bash
   npm install next@latest
   ```







