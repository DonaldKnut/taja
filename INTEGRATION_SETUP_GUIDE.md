# 🔌 Integration Setup Guide - Plug & Play

This guide shows you exactly what to do once you have your API keys to enable all integrations.

---

## ✅ What's Already Done

All the code is written and ready. You just need to add your API keys to enable:

1. ✅ **Resend Email** - Email verification ready
2. ✅ **Dojah Identity Verification** - NIN, Passport, Voter's Card, Driver's License with fallback
3. ✅ **OAuth Redirect** - Fixed to use FRONTEND_URL
4. ✅ **CORS** - Helper added for cross-origin requests
5. ✅ **Phone Verification** - Disabled (removed to avoid SMS costs)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Add Environment Variables

Add these to your `.env.local` file (for development) or your hosting platform's environment variables (for production):

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
# Or use your verified domain: EMAIL_FROM=no-reply@yourdomain.com

# Identity Verification (Dojah)
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here

# Frontend URL (for OAuth redirect)
FRONTEND_URL=https://tajaapp.shop
# For local development: FRONTEND_URL=http://localhost:3000

# OAuth (if not already set)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback
```

### Step 2: Get Your API Keys

#### Resend API Key
1. Go to https://resend.com
2. Sign up / Log in
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy the key (starts with `re_`)
6. Paste it as `RESEND_API_KEY` in your `.env.local`

**Free Tier**: 3,000 emails/month, 100 emails/day

#### Dojah API Keys
1. Go to https://dojah.io
2. Sign up / Log in
3. Go to **API Keys** section
4. Copy your **API Key** and **App ID**
5. Paste them in your `.env.local`

**Pricing**: ~₦50-200 per verification depending on document type

---

## 📧 Email Verification (Resend)

### What Happens Now

Once `RESEND_API_KEY` is set:

✅ **Email verification codes** are sent automatically when:
- User registers
- User requests new verification code

✅ **Welcome emails** are sent when:
- User successfully registers
- User signs up via Google OAuth

✅ **Password reset emails** are sent when:
- User requests password reset

### Testing

1. Register a new user
2. Check your email inbox (or Resend dashboard)
3. You should receive a verification email with a 6-digit code

### If RESEND_API_KEY is NOT set:

- ❌ Emails are **NOT sent**
- ✅ Code still generated and shown in console (development only)
- ✅ User registration still works
- ⚠️ Users won't receive emails

---

## 🆔 Identity Verification (Dojah)

### How It Works

1. **User submits ID** (NIN, Passport, Voter's Card, or Driver's License)
2. **System tries Dojah first**:
   - If Dojah API keys are set → Tries to verify via Dojah
   - If Dojah succeeds → Marked as `verified: true`, `provider: 'dojah'`
   - If Dojah fails → Falls back to manual verification
3. **Fallback to Manual Verification**:
   - If Dojah is not configured → `requiresManualVerification: true`
   - If Dojah API call fails → `requiresManualVerification: true`
   - Admin must manually verify these submissions

### Response Format

```json
{
  "success": true,
  "verified": true,  // true if Dojah verified successfully
  "requiresManualVerification": false,  // true if needs admin review
  "provider": "dojah",  // "dojah" | "manual"
  "data": {
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    ...
  },
  "message": "Identity verified successfully via Dojah"
}
```

### Fallback Behavior

When Dojah is not available:

```json
{
  "success": true,
  "verified": false,
  "requiresManualVerification": true,
  "provider": "manual",
  "message": "Identity will be manually verified by admin"
}
```

### Testing

1. Submit KYC with a valid NIN (11 digits)
2. If Dojah keys are set: Should verify instantly
3. If Dojah keys are NOT set: Returns success but `requiresManualVerification: true`

---

## 🔐 OAuth Redirect Fix

### What Was Fixed

- Changed from `NEXTAUTH_URL` to `FRONTEND_URL` (with fallback)
- OAuth callback now redirects to the correct frontend URL

### What You Need To Do

1. Set `FRONTEND_URL` in your environment variables:
   ```env
   FRONTEND_URL=https://tajaapp.shop
   ```

2. For local development:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

3. **That's it!** OAuth will now redirect correctly.

---

## 🌐 CORS Configuration

### What Was Added

- Created `src/lib/cors.ts` with CORS helper functions
- Added CORS headers to identity verification endpoint
- Supports multiple allowed origins

### Allowed Origins

By default, these origins are allowed:
- `FRONTEND_URL` (if set)
- `NEXTAUTH_URL` (if set)
- `https://tajaapp.shop`
- `http://localhost:3000` (development)

### Adding More Origins

Edit `src/lib/cors.ts`:

```typescript
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://tajaapp.shop',
  'https://your-custom-domain.com',  // Add here
  // ...
];
```

---

## 📱 Phone Verification - DISABLED

### Why?

Phone verification via SMS costs money per SMS sent. To avoid costs, phone verification is **disabled**.

### What Still Works

✅ Phone numbers are still:
- Collected during registration
- Validated for format (Nigerian format)
- Stored in the database

❌ Phone numbers are NOT:
- Verified via SMS
- Verified via OTP
- Verified via external service

### If You Want to Enable Later

1. Sign up for SMS service (Termii, Twilio, etc.)
2. Add API keys to environment variables
3. Uncomment/modify phone verification code in `src/lib/identityVerification.ts`

---

## ✅ Verification Checklist

After adding your API keys, verify everything works:

### Email Verification
- [ ] Register a new user
- [ ] Check email inbox for verification code
- [ ] Verify email with code
- [ ] Should show "Email verified successfully"

### Identity Verification
- [ ] Submit KYC with valid NIN
- [ ] Check response - should have `verified: true` if Dojah works
- [ ] If Dojah not configured, should have `requiresManualVerification: true`

### OAuth
- [ ] Click "Sign in with Google"
- [ ] Complete Google authentication
- [ ] Should redirect back to your frontend
- [ ] Should be logged in

### CORS
- [ ] Make API call from frontend
- [ ] Should not see CORS errors in browser console
- [ ] Response should include CORS headers

---

## 🐛 Troubleshooting

### Emails Not Sending

**Check:**
1. `RESEND_API_KEY` is set correctly
2. Key starts with `re_`
3. No typos in the key
4. Check Resend dashboard for errors
5. Check server logs for errors

**Common Issues:**
- Invalid API key → Check Resend dashboard
- Domain not verified → Use `onboarding@resend.dev` for testing
- Rate limit → Free tier: 100 emails/day

### Identity Verification Not Working

**Check:**
1. `DOJAH_API_KEY` is set correctly
2. `DOJAH_APP_ID` is set correctly
3. API keys are valid in Dojah dashboard
4. Sufficient credits in Dojah account

**If Dojah Fails:**
- System automatically falls back to manual verification
- This is expected behavior
- Admin can verify manually in dashboard

### OAuth Not Redirecting

**Check:**
1. `FRONTEND_URL` is set correctly
2. URL matches your actual frontend domain
3. No trailing slash in URL
4. Google OAuth credentials are correct

**Fix:**
```env
FRONTEND_URL=https://tajaapp.shop  # ✅ Correct
FRONTEND_URL=https://tajaapp.shop/ # ❌ Wrong (trailing slash)
```

### CORS Errors

**Check:**
1. Frontend URL is in `ALLOWED_ORIGINS` in `src/lib/cors.ts`
2. CORS headers are added to responses
3. OPTIONS preflight requests are handled

**Fix:**
- Add your frontend URL to `ALLOWED_ORIGINS` in `src/lib/cors.ts`
- Ensure API routes use `addCorsHeaders()` helper

---

## 📝 Summary

### What You Need To Do

1. ✅ Add `RESEND_API_KEY` → Email verification works
2. ✅ Add `DOJAH_API_KEY` and `DOJAH_APP_ID` → Identity verification works
3. ✅ Add `FRONTEND_URL` → OAuth redirects correctly
4. ✅ Everything else is already configured!

### What's Already Working

- ✅ Email templates are ready
- ✅ Identity verification with fallback is ready
- ✅ OAuth redirect logic is fixed
- ✅ CORS helpers are in place
- ✅ Phone verification is disabled (cost savings)

### Time to Setup

- **Resend**: 2 minutes (just add API key)
- **Dojah**: 2 minutes (just add API keys)
- **FRONTEND_URL**: 30 seconds (just add URL)
- **Total**: ~5 minutes to enable everything!

---

## 🎉 You're All Set!

Once you add the API keys, everything will work automatically. No code changes needed - it's truly plug-and-play! 🚀


