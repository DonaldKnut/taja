# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for Taja.Shop.

## Prerequisites

- A Google account
- Access to Google Cloud Console (https://console.cloud.google.com/)

---

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top (next to "Google Cloud")
   - Click "New Project"
   - Enter project name: `Taja Shop` (or any name you prefer)
   - Click "Create"
   - Wait for the project to be created (may take a few seconds)

3. **Select Your Project**
   - Make sure your new project is selected in the project dropdown

---

## Step 2: Enable Google+ API / OAuth Consent Screen

1. **Navigate to OAuth Consent Screen**
   - In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
   - Or visit: https://console.cloud.google.com/apis/credentials/consent

2. **Choose User Type**
   - Select **"External"** (unless you have a Google Workspace account)
   - Click "Create"

3. **Fill in App Information**
   - **App name**: `Taja Shop` (or your preferred name)
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your app logo
   - **App domain**: (Optional) `taja.shop` or your domain
   - **Developer contact information**: Your email address
   - Click "Save and Continue"

4. **Configure Scopes**
   - Click "Add or Remove Scopes"
   - Under "Manually add scopes", add:
     - `userinfo.email`
     - `userinfo.profile`
   - Or use the default scopes (email, profile, openid)
   - Click "Update" then "Save and Continue"

5. **Add Test Users (if in Testing mode)**
   - If your app is in "Testing" mode, add test user emails
   - Click "Add Users" and enter email addresses
   - Click "Save and Continue"

6. **Review and Submit**
   - Review your settings
   - Click "Back to Dashboard" or "Save and Continue"

---

## Step 3: Create OAuth 2.0 Credentials

1. **Navigate to Credentials**
   - In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
   - Or visit: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"OAuth client ID"**

3. **Configure OAuth Client**
   - **Application type**: Select **"Web application"**
   - **Name**: `Taja Shop Web Client` (or any name)

4. **Add Authorized Redirect URIs**
   - Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
   - Add the following URIs (one at a time):
   
   **For Local Development:**
   ```
   http://localhost:3000/api/auth/oauth/google/callback
   ```
   
   **For Production (when ready):**
   ```
   https://yourdomain.com/api/auth/oauth/google/callback
   https://taja.shop/api/auth/oauth/google/callback
   ```
   
   - Click "Create"

5. **Copy Your Credentials**
   - A popup will appear with your credentials
   - **IMPORTANT**: Copy these values now (you won't be able to see the secret again!)
   - **Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click "OK"

---

## Step 4: Configure Environment Variables

1. **Open your `.env.local` file**
   ```bash
   # In your project root
   code .env.local
   # or
   nano .env.local
   ```

2. **Add/Update the following variables:**

   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
   
   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   
   # Optional: For client-side OAuth (if needed)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   ```

3. **Replace the placeholder values:**
   - Replace `your_client_id_here` with your actual Client ID
   - Replace `your_client_secret_here` with your actual Client Secret
   - Keep `GOOGLE_REDIRECT_URI` as shown (must match exactly what you added in Google Console)
   - Keep `NEXTAUTH_URL` as `http://localhost:3000` for local development

---

## Step 5: Verify Your Setup

### Check Your `.env.local` File

Your Google OAuth section should look like this:

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
NEXTAUTH_URL=http://localhost:3000
```

### Important Notes:

1. **Redirect URI Must Match Exactly**
   - The `GOOGLE_REDIRECT_URI` in your `.env.local` must **exactly match** what you added in Google Cloud Console
   - Include the full path: `/api/auth/oauth/google/callback`
   - Use `http://` for localhost, `https://` for production

2. **NEXTAUTH_URL**
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
   - This is used by Next.js for generating URLs

3. **NEXT_PUBLIC_GOOGLE_CLIENT_ID**
   - This is optional and only needed if you want to use Google OAuth on the client-side
   - For now, you can use the same value as `GOOGLE_CLIENT_ID`

---

## Step 6: Test Your Setup

1. **Restart Your Development Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Test the Login Flow**
   - Navigate to: http://localhost:3000/login
   - Click "Continue with Google"
   - You should be redirected to Google's OAuth consent screen
   - After authorizing, you should be redirected back to your app

3. **Troubleshooting**

   **If you see "redirect_uri_mismatch" error:**
   - Check that `GOOGLE_REDIRECT_URI` in `.env.local` exactly matches what's in Google Cloud Console
   - Make sure there are no trailing slashes or extra spaces
   - The URI must be in the "Authorized redirect URIs" list

   **If you see "invalid_client" error:**
   - Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
   - Make sure there are no extra spaces or quotes in your `.env.local` file

   **If the page doesn't load:**
   - Make sure your dev server is running
   - Check the browser console for errors
   - Verify all environment variables are set correctly

---

## Step 7: Production Setup

When you're ready to deploy to production:

1. **Update Google Cloud Console**
   - Go back to your OAuth client credentials
   - Click the edit icon (pencil) next to your OAuth client
   - Add your production redirect URI:
     ```
     https://yourdomain.com/api/auth/oauth/google/callback
     ```
   - Save changes

2. **Update Environment Variables**
   - In your production environment (Vercel, Netlify, etc.), set:
     ```env
     GOOGLE_CLIENT_ID=your_client_id_here
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/google/callback
     NEXTAUTH_URL=https://yourdomain.com
     NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
     ```

3. **Publish Your OAuth Consent Screen**
   - In Google Cloud Console, go to "OAuth consent screen"
   - If your app is in "Testing" mode, click "PUBLISH APP"
   - This makes it available to all users (not just test users)

---

## Quick Reference

### Where to Find Your Credentials

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **Credentials Page**: APIs & Services → Credentials
3. **OAuth Consent Screen**: APIs & Services → OAuth consent screen

### Required Values

- **GOOGLE_CLIENT_ID**: Found in OAuth 2.0 Client IDs section
- **GOOGLE_CLIENT_SECRET**: Found in OAuth 2.0 Client IDs section (click the eye icon to reveal)
- **GOOGLE_REDIRECT_URI**: Must match exactly what you configured in Google Console
- **NEXTAUTH_URL**: Your application URL (localhost for dev, domain for production)

### Example Values

```env
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/oauth/google/callback
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

---

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - It's already in `.gitignore`, but double-check
   - Never share your Client Secret publicly

2. **Use Different Credentials for Production**
   - Create separate OAuth clients for development and production
   - This allows you to have different redirect URIs and better security

3. **Rotate Secrets Regularly**
   - If a secret is compromised, regenerate it in Google Cloud Console
   - Update all environments immediately

4. **Limit OAuth Scopes**
   - Only request the scopes you actually need
   - Users appreciate minimal permission requests

---

## Need Help?

If you encounter issues:

1. Check the browser console for error messages
2. Check your server logs for detailed errors
3. Verify all environment variables are set correctly
4. Ensure the redirect URI matches exactly in both places
5. Make sure your OAuth consent screen is published (for production)

---

**That's it!** Your Google OAuth should now be configured and ready to use. 🎉








