# Production URLs Configuration

## ✅ Current Production URLs

### Frontend
- **Production URL**: `https://tajaapp.shop/`
- **Host**: Netlify

### Backend
- **Production URL**: `https://tajaapp-backend-nzkj.onrender.com`
- **Host**: Render
- **API Base**: `https://tajaapp-backend-nzkj.onrender.com/api`

---

## 🔄 OAuth Configuration

### Google OAuth Redirect URIs

You need **BOTH** redirect URIs in Google OAuth Console:

1. **Production**:
   ```
   https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback
   ```

2. **Development** (for local testing):
   ```
   http://localhost:5000/api/auth/oauth/google/callback
   ```

---

## 🔧 Backend Environment Variables (Render)

Set these in **Render Dashboard** → Environment Variables:

```env
# Frontend URL (CRITICAL for OAuth redirects)
FRONTEND_URL=https://tajaapp.shop

# Backend URL
BACKEND_URL=https://tajaapp-backend-nzkj.onrender.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback

# ... other environment variables
```

---

## 🔧 Frontend Environment Variables (Netlify)

Set in **Netlify Dashboard** → Site Settings → Environment Variables, or in `netlify.toml`:

```toml
[build.environment]
  NEXT_PUBLIC_API_URL = "https://tajaapp-backend-nzkj.onrender.com"
```

**Note**: This is already configured in `netlify.toml`.

---

## 🔄 OAuth Flow (Production)

```
1. User clicks "Sign in with Google" on https://tajaapp.shop
   ↓
2. Redirects to: https://tajaapp-backend-nzkj.onrender.com/api/auth/google?redirect=/marketplace
   ↓
3. Backend redirects to Google OAuth consent screen
   ↓
4. User approves on Google
   ↓
5. Google redirects to: https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback?code=...&state=...
   ↓
6. Backend processes OAuth callback:
   - Exchanges code for tokens
   - Creates/updates user account
   - Generates JWT token
   ↓
7. Backend redirects to: https://tajaapp.shop/auth/callback?token=...&refreshToken=...&success=true&redirect=%2Fmarketplace
   ↓
8. Frontend callback handler processes tokens and redirects user to /marketplace
```

---

## 🧪 Testing

### Test Production OAuth

1. Visit: `https://tajaapp.shop`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Should redirect to: `https://tajaapp.shop/auth/callback?token=...&success=true`
5. Should then redirect to intended page (user logged in)

---

## ⚠️ Important Notes

1. **Backend MUST set `FRONTEND_URL`**: The backend OAuth callback handler must use `FRONTEND_URL` environment variable to redirect to the frontend.

2. **Google OAuth Console**: Make sure both production and development redirect URIs are configured in Google OAuth Console.

3. **CORS**: Ensure backend CORS allows `https://tajaapp.shop` origin.

4. **Environment Variables**: Never hardcode URLs in code. Always use environment variables.

---

## 📋 Quick Checklist

- [x] Frontend uses production backend URL (`https://tajaapp-backend-nzkj.onrender.com`)
- [ ] Backend has `FRONTEND_URL=https://tajaapp.shop` set in Render
- [ ] Google OAuth has production redirect URI configured
- [ ] Google OAuth has development redirect URI configured (for testing)
- [ ] Backend CORS allows `https://tajaapp.shop` origin
- [ ] Test OAuth flow end-to-end in production




