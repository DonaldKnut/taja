# Node.js Setup Guide

## Issue
You're getting this error:
```
npm : The term 'npm' is not recognized
```

This means Node.js (which includes npm) is not installed on your system.

## Solution: Install Node.js

### Option 1: Download from Official Website (Recommended)

1. **Visit**: https://nodejs.org/
2. **Download**: The LTS (Long Term Support) version (recommended)
   - This will install both Node.js and npm
3. **Run the installer**:
   - Follow the installation wizard
   - Make sure to check "Add to PATH" option
   - Complete the installation
4. **Restart your terminal/PowerShell**
5. **Verify installation**:
   ```powershell
   node --version
   npm --version
   ```

### Option 2: Using Chocolatey (Windows Package Manager)

If you have Chocolatey installed:

```powershell
choco install nodejs-lts
```

### Option 3: Using Winget (Windows Package Manager)

```powershell
winget install OpenJS.NodeJS.LTS
```

## After Installation

1. **Close and reopen PowerShell/terminal**
2. **Verify installation**:
   ```powershell
   node --version
   npm --version
   ```
3. **Navigate to your project**:
   ```powershell
   cd C:\Users\DELL\Desktop\taja_frontend
   ```
4. **Install dependencies** (if not already installed):
   ```powershell
   npm install
   ```
5. **Start development server**:
   ```powershell
   npm run dev
   ```

## Troubleshooting

### If npm is still not recognized after installation:

1. **Check if Node.js is installed**:
   - Look for Node.js in "Add or Remove Programs"
   - If installed, uninstall and reinstall with "Add to PATH" checked

2. **Manually add to PATH**:
   - Find Node.js installation path (usually `C:\Program Files\nodejs\`)
   - Add it to System Environment Variables PATH
   - Restart terminal

3. **Verify PATH**:
   ```powershell
   $env:PATH -split ';' | Select-String nodejs
   ```

## Required Versions

- **Node.js**: 18.x or higher (LTS recommended)
- **npm**: Comes with Node.js (usually 9.x or higher)

## Next Steps

Once Node.js is installed:

1. Install project dependencies:
   ```powershell
   npm install
   ```

2. Create `.env.local` file (if needed):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_here
   ```

3. Start development server:
   ```powershell
   npm run dev
   ```

4. Open browser:
   - Navigate to http://localhost:3000

## Need Help?

- Node.js Documentation: https://nodejs.org/docs/
- npm Documentation: https://docs.npmjs.com/
- Check if installation was successful: `node --version` and `npm --version`









