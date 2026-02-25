# Quick Fix: npm Not Recognized

## The Problem
```
npm : The term 'npm' is not recognized
```

## Quick Solution

### Step 1: Install Node.js
1. Go to: **https://nodejs.org/**
2. Download the **LTS version** (recommended)
3. Run the installer
4. **IMPORTANT**: Make sure "Add to PATH" is checked during installation
5. Complete the installation

### Step 2: Restart PowerShell
- Close your current PowerShell window
- Open a new PowerShell window

### Step 3: Verify Installation
```powershell
node --version
npm --version
```

You should see version numbers (e.g., `v20.10.0` and `10.2.3`)

### Step 4: Navigate to Project
```powershell
cd C:\Users\DELL\Desktop\taja_frontend
```

### Step 5: Install Dependencies
```powershell
npm install
```

### Step 6: Start Development Server
```powershell
npm run dev
```

## If It Still Doesn't Work

1. **Check if Node.js is installed**:
   - Press `Win + R`
   - Type: `appwiz.cpl`
   - Look for "Node.js" in the list

2. **If installed but not working**:
   - Uninstall Node.js
   - Reinstall from nodejs.org
   - Make sure "Add to PATH" is checked

3. **Manual PATH fix**:
   - Search "Environment Variables" in Windows
   - Edit System Environment Variables
   - Add: `C:\Program Files\nodejs\` to PATH
   - Restart PowerShell

## That's It!

Once npm is working, you can:
- `npm install` - Install dependencies
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run lint` - Check code quality









