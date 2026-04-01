# Environment Variables Setup Guide

This document explains how the backend environment variables have been mapped to the frontend Next.js application.

## File Created
- `.env.local` - Contains all environment variables for local development

## Variable Mapping

### Server Configuration
- `NODE_ENV` → `development` (matches backend)
- `PORT` → `3000` (Next.js default, backend uses 5000)
- `NEXTAUTH_URL` → `http://localhost:3000` (Next.js convention)

### Database
- `MONGODB_URI` → Directly copied from backend

### JWT Authentication
- `JWT_SECRET` → Directly copied from backend
- `JWT_REFRESH_SECRET` → Directly copied from backend
- `JWT_EXPIRE` → `30d` (mapped from backend's `JWT_EXPIRES_IN=30d`)
- `JWT_REFRESH_EXPIRE` → `7d` (mapped from backend's `JWT_REFRESH_EXPIRES_IN=7d`)

### Email Service
- `RESEND_API_KEY` → Directly copied from backend
- `EMAIL_FROM` → `teams@tajaapp.shop` (mapped from backend's `RESEND_FROM`)
- `RESEND_FROM` → Also included for compatibility

### Frontend URLs (Client-Side Accessible)
These use `NEXT_PUBLIC_` prefix so they're accessible in the browser:
- `NEXT_PUBLIC_SITE_URL` → `http://localhost:3000` (must match production domain for canonical URLs, Open Graph, and sitemap)
- `NEXT_PUBLIC_SUPPORT_PHONE` → Optional (e.g. `+2348012345678`). If set, included in Organization JSON-LD for rich results; omit to avoid placeholder numbers in schema
- `NEXT_PUBLIC_API_URL` → Empty (uses relative paths for internal API routes)
- `NEXT_PUBLIC_SOCKET_URL` → `http://localhost:3000`

### Google OAuth
- `GOOGLE_CLIENT_ID` → Empty (needs to be filled from backend)
- `GOOGLE_CLIENT_SECRET` → Empty (needs to be filled from backend)
- `GOOGLE_REDIRECT_URI` → `http://localhost:3000/api/auth/oauth/google/callback`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Empty (needs to be filled for client-side OAuth)

### Google Gemini AI
- `GEMINI_API_KEY` → Your Google Gemini API Key
- `GEMINI_MODEL` → Optional. Default is `gemini-2.0-flash`. Use a Flash model for free-tier keys (Pro models have very low quota and will hit 429 quickly). Omit or set to `gemini-2.0-flash`.

### Cloudflare R2 Storage
All R2 variables directly copied from backend:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`

### Cloudflare Images & Stream
- `CLOUDFLARE_ACCOUNT_ID` → Copied from backend
- `CLOUDFLARE_API_TOKEN` → Empty (needs to be set if using Cloudflare Images/Stream APIs)
- `CLOUDFLARE_IMAGES_DELIVERY_URL` → Empty
- `CLOUDFLARE_STREAM_DELIVERY_URL` → Empty

### Payment Providers (Flutterwave & Paystack)
**When you get your corporate bank account and payment gateway keys, add them here:**

- `FLUTTERWAVE_PUBLIC_KEY` → Your Flutterwave public key (from Flutterwave dashboard)
- `FLUTTERWAVE_SECRET_KEY` → Your Flutterwave secret key (from Flutterwave dashboard)
- `FLUTTERWAVE_ENCRYPTION_KEY` → Your Flutterwave encryption key (optional, for additional security)
- `FLUTTERWAVE_SECRET_HASH` → Your Flutterwave webhook secret hash (for webhook verification)
- `FLUTTERWAVE_BASE_URL` → `https://api.flutterwave.com/v3` (default, use `https://api.flutterwave.com/v3` for live)

- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` → Your Paystack public key (client-side accessible)
- `PAYSTACK_SECRET_KEY` → Your Paystack secret key (server-side only)
- `PAYSTACK_BASE_URL` → `https://api.paystack.co` (default, use `https://api.paystack.co` for live)

**Platform Fee Configuration:**
- `PLATFORM_FEE_PERCENTAGE` → `7` (default 7% platform fee per transaction)

**Note:** The payment system is designed to work with either Flutterwave OR Paystack (or both). 
If both are configured, Flutterwave will be used as default. The system will automatically 
select the configured provider when processing payments.

### Push Notifications
- `VAPID_SUBJECT` → Copied from backend
- `VAPID_PUBLIC_KEY` → Copied from backend
- `VAPID_PRIVATE_KEY` → Copied from backend

### Other Services
- `TERMII_API_KEY` → Empty (SMS verification)
- `TERMII_SENDER_ID` → `TajaShop`
- `GOKADA_API_KEY` → Empty (delivery provider)
- `KWIK_API_KEY` → Empty (delivery provider)
- `ENCRYPTION_KEY` → Placeholder (needs to be generated)
- `LOGO_URL` → Empty (optional)

## Important Notes

1. **Google OAuth**: The backend has empty `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. You'll need to:
   - Get these from Google Cloud Console
   - Add them to `.env.local`
   - Also set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for client-side OAuth

2. **Cloudflare API Token**: If you want to use Cloudflare Images/Stream APIs (not just R2), you'll need to:
   - Generate an API token from Cloudflare dashboard
   - Add it to `CLOUDFLARE_API_TOKEN`
   - Set the delivery URLs

3. **Payment Providers**: Fill in the payment provider keys when ready to enable payments.

4. **Client-Side vs Server-Side**: 
   - Variables with `NEXT_PUBLIC_` prefix are accessible in the browser
   - Variables without prefix are server-side only (more secure)

5. **Production**: For production deployment, update:
   - `NEXTAUTH_URL` to your production domain
   - `NEXT_PUBLIC_SITE_URL` to your production domain
   - All API keys and secrets
   - Database connection strings

## Production (Vercel) – Google OAuth

For **Sign in with Google** to work in production:

1. **Google Cloud Console** → APIs & Services → Credentials → your OAuth 2.0 Client.
2. Add your **production** URLs (use the exact URL your app is served from, e.g. Vercel):
   - **Authorised JavaScript origins**
     - `https://tajaapp-delta.vercel.app` (or your custom domain, e.g. `https://tajaapp.shop`)
   - **Authorised redirect URIs**
     - `https://tajaapp-delta.vercel.app/api/auth/oauth/google/callback` (or same base + `/api/auth/oauth/google/callback`)
3. You must list **every** domain where the app runs (e.g. both `tajaapp-delta.vercel.app` and `tajaapp.shop` if you use both).
4. Optional: In Vercel project → Settings → Environment Variables, set:
   - `FRONTEND_URL` = `https://tajaapp-delta.vercel.app` (or your canonical production URL)
   - `GOOGLE_REDIRECT_URI` = `https://tajaapp-delta.vercel.app/api/auth/oauth/google/callback`
   If unset, the app uses `VERCEL_URL` so the Vercel deployment URL must be in Google Console.

## Next Steps

1. Fill in missing Google OAuth credentials
2. Set up Cloudflare API token if needed
3. Configure payment provider keys when ready
4. Generate a proper encryption key (32 characters)
5. Test the application with `npm run dev`



