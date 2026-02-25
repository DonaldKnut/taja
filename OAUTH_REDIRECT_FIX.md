# 🔧 Google OAuth Redirect Fix Guide

## 🚨 Problem
Google OAuth is redirecting to `tajaapp-backend-nzkj.onrender.com` instead of `tajaapp.shop` (frontend).

## ✅ Solution Checklist

### 1. **Netlify Environment Variables** ✅ (Already Fixed in Code)

The code now uses `FRONTEND_URL` consistently. Verify these are set in **Netlify Dashboard**:

1. Go to: **Netlify Dashboard** → Your Site → **Site Settings** → **Environment Variables**
2. Ensure these variables are set:

```env
FRONTEND_URL=https://tajaapp.shop
NEXTAUTH_URL=https://tajaapp.shop
GOOGLE_REDIRECT_URI=https://tajaapp.shop/api/auth/oauth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important**: `GOOGLE_REDIRECT_URI` should point to **FRONTEND** (`tajaapp.shop`), NOT backend!

### 2. **Google Cloud Console OAuth Settings** ⚠️ (CRITICAL - You Need to Fix This)

This is the **most likely cause** of the issue. Google OAuth Console must have the **frontend URL** as the authorized redirect URI.

#### Steps to Fix:

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Credentials**:
   - Go to: **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID (the one you're using)

3. **Check Authorized Redirect URIs**:
   - Click on your OAuth Client ID to edit
   - Look at **"Authorized redirect URIs"** section
   - You should see something like:
     ```
     https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback  ❌ WRONG
     ```

4. **Fix the Redirect URI**:
   - **Remove** the backend URL if it's there
   - **Add** the frontend URL:
     ```
     https://tajaapp.shop/api/auth/oauth/google/callback  ✅ CORRECT
     ```
   - Also add for local development (optional):
     ```
     http://localhost:3000/api/auth/oauth/google/callback
     ```

5. **Save Changes**:
   - Click **Save**
   - Wait a few minutes for changes to propagate

### 3. **Verify Code Configuration** ✅ (Already Fixed)

The code has been updated to use `FRONTEND_URL` consistently:

- ✅ `src/app/api/auth/google/route.ts` - Uses `FRONTEND_URL` for redirect URI
- ✅ `src/app/api/auth/oauth/google/callback/route.ts` - Uses `FRONTEND_URL` for redirects
- ✅ `netlify.toml` - Added `FRONTEND_URL` and `GOOGLE_REDIRECT_URI`

### 4. **Test the Fix**

After updating Google Cloud Console:

1. **Clear browser cache/cookies** (or use incognito)
2. **Visit**: `https://tajaapp.shop/login`
3. **Click**: "Sign in with Google"
4. **Complete**: Google authentication
5. **Verify**: You should be redirected to:
   ```
   https://tajaapp.shop/auth/callback?token=...&success=true
   ```
   NOT to:
   ```
   https://tajaapp-backend-nzkj.onrender.com/...
   ```

## 📋 Quick Reference

### Correct OAuth Flow:
```
1. User clicks "Sign in with Google" on tajaapp.shop
   ↓
2. Redirects to Google OAuth consent screen
   ↓
3. User approves
   ↓
4. Google redirects to: https://tajaapp.shop/api/auth/oauth/google/callback  ✅
   ↓
5. Frontend processes callback and redirects to: /auth/callback?token=...
   ↓
6. User is logged in and redirected to dashboard
```

### Wrong OAuth Flow (Current Issue):
```
4. Google redirects to: https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback  ❌
```

## 🔍 How to Verify Current Settings

### Check Netlify Environment Variables:
1. Netlify Dashboard → Site Settings → Environment Variables
2. Look for `GOOGLE_REDIRECT_URI` - should be `https://tajaapp.shop/api/auth/oauth/google/callback`

### Check Google Cloud Console:
1. Google Cloud Console → APIs & Services → Credentials
2. Click your OAuth 2.0 Client ID
3. Check "Authorized redirect URIs" - should include `https://tajaapp.shop/api/auth/oauth/google/callback`

## ⚠️ Common Mistakes

1. **❌ Setting redirect URI to backend URL**:
   ```
   GOOGLE_REDIRECT_URI=https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback
   ```
   **✅ Should be frontend URL**:
   ```
   GOOGLE_REDIRECT_URI=https://tajaapp.shop/api/auth/oauth/google/callback
   ```

2. **❌ Google Console has backend URL**:
   - Must have frontend URL in Google Cloud Console

3. **❌ Missing FRONTEND_URL in Netlify**:
   - Must set `FRONTEND_URL=https://tajaapp.shop` in Netlify

## 🎯 Action Items

- [ ] Update Google Cloud Console OAuth redirect URI to frontend URL
- [ ] Verify Netlify environment variables are set correctly
- [ ] Test OAuth flow after changes
- [ ] Clear browser cache and test again
