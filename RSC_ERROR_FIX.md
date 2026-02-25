# RSC Payload Fetch Error - Fix Guide

## 🚨 Error

```
Failed to fetch RSC payload for https://tajaapp.shop/. Falling back to browser navigation.
TypeError: Failed to fetch
```

## 🔍 What is RSC?

**RSC (React Server Components)** is a Next.js feature that allows components to run on the server. When a client component needs server data, Next.js fetches an "RSC payload" from the server.

## 🐛 Why This Error Occurs

This error typically happens when:

1. **Network Issues**: The client can't reach the Next.js server to fetch RSC payloads
2. **Netlify Configuration**: The Next.js plugin might not be handling RSC correctly
3. **Timeout Issues**: The server is taking too long to respond
4. **CORS/Headers**: Missing or incorrect headers preventing RSC payload fetching

## ✅ Fixes Applied

### 1. Updated `netlify.toml`

- ✅ Added `NEXTAUTH_URL` environment variable
- ✅ Added proper headers configuration
- ✅ Added functions configuration for better Next.js support

### 2. Updated `next.config.js`

- ✅ Added `output: "standalone"` for better Netlify compatibility
- ✅ Added `serverActions` configuration for better RSC handling
- ✅ Improved body size limits

## 🔧 Additional Steps to Fix

### Step 1: Verify Netlify Environment Variables

In **Netlify Dashboard** → **Site Settings** → **Environment Variables**, ensure:

```env
NEXT_PUBLIC_API_URL=https://tajaapp-backend-nzkj.onrender.com
NEXTAUTH_URL=https://tajaapp.shop
NEXTAUTH_SECRET=your_secret_here
```

### Step 2: Clear Netlify Build Cache

1. Go to **Netlify Dashboard** → **Deploys**
2. Click **Trigger deploy** → **Clear cache and deploy site**

### Step 3: Verify Netlify Next.js Plugin

Ensure `@netlify/plugin-nextjs` is installed:

```bash
npm install @netlify/plugin-nextjs --save-dev
```

### Step 4: Check Netlify Function Timeouts

If the error persists, it might be a timeout issue. Check:

1. **Netlify Dashboard** → **Functions**
2. Ensure function timeout is set to at least **26 seconds** (Netlify's max)

### Step 5: Monitor Network Tab

1. Open browser DevTools → **Network** tab
2. Look for requests to `/_next/static/chunks/...` or `/_next/data/...`
3. Check if these requests are failing (status 500, timeout, or CORS error)

## 🔍 Debugging

### Check Browser Console

Look for:
- Network errors
- CORS errors
- Timeout errors
- 500/502/503 errors

### Check Netlify Logs

1. **Netlify Dashboard** → **Functions** → **Logs**
2. Look for errors related to:
   - RSC payload generation
   - Server component rendering
   - Function timeouts

### Test Locally

```bash
npm run build
npm run start
```

Visit `http://localhost:3000` and check if the error occurs locally.

## 🎯 Expected Behavior After Fix

- ✅ No "Failed to fetch RSC payload" errors in console
- ✅ Pages load normally
- ✅ Navigation works smoothly
- ✅ Server components render correctly

## 📝 Notes

- This error is **non-critical** - Next.js falls back to browser navigation
- The app should still work, but might be slightly slower
- The fix improves RSC handling but might not eliminate all cases
- If the error persists, it might be a Netlify-specific issue that requires Netlify support

## 🔗 Related Issues

- [Next.js RSC Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Netlify Next.js Plugin](https://github.com/netlify/netlify-plugin-nextjs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

