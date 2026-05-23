# Environment Configuration Guide

## 🌐 URLs

### Production (Live)
- **Frontend**: `https://tajaapp.shop/`
- **Backend**: `https://tajaapp-backend-nzkj.onrender.com`

### Development (Localhost)
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`

---

## 📋 Frontend Environment Variables

### Production (Netlify)

Set in **Netlify Dashboard** → Site Settings → Environment Variables, or in `netlify.toml`:

```toml
[build.environment]
  NEXT_PUBLIC_API_URL = "https://tajaapp-backend-nzkj.onrender.com"
```

### Development (Local)

Create `.env.local` file in the root directory:

```bash
# For local development with localhost backend
NEXT_PUBLIC_API_URL=http://localhost:5000

# For local development with production backend (if needed)
# NEXT_PUBLIC_API_URL=https://tajaapp-backend-nzkj.onrender.com
```

### Default Behavior

If `NEXT_PUBLIC_API_URL` is not set, the app defaults to:
```
https://tajaapp-backend-nzkj.onrender.com
```

This means:
- ✅ Production: Works out of the box (uses production backend)
- ✅ Development: Works if you create `.env.local` with `http://localhost:5000`

---

## 📋 Backend Environment Variables

### Production (Render)

Set in **Render Dashboard** → Environment Variables:

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

### Development (Local)

Create `.env` file in backend directory:

```env
# Frontend URL (CRITICAL for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# Backend URL
BACKEND_URL=http://localhost:5000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/oauth/google/callback

# ... other environment variables
```

---

## 🔄 OAuth Configuration

### Google OAuth Console

You need **TWO** redirect URIs in Google OAuth Console:

1. **Production**:
   ```
   https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback
   ```

2. **Development**:
   ```
   http://localhost:5000/api/auth/oauth/google/callback
   ```

### How OAuth Flow Works

#### Production Flow
```
1. User clicks "Sign in with Google" on https://tajaapp.shop
   ↓
2. Redirects to: https://tajaapp-backend-nzkj.onrender.com/api/auth/google?redirect=/marketplace
   ↓
3. Backend redirects to Google OAuth
   ↓
4. User approves on Google
   ↓
5. Google redirects to: https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback
   ↓
6. Backend processes OAuth and redirects to:
   https://tajaapp.shop/auth/callback?token=...&success=true&redirect=/marketplace
   ↓
7. Frontend handles callback and redirects user to /marketplace
```

#### Development Flow
```
1. User clicks "Sign in with Google" on http://localhost:3000
   ↓
2. Redirects to: http://localhost:5000/api/auth/google?redirect=/marketplace
   ↓
3. Backend redirects to Google OAuth
   ↓
4. User approves on Google
   ↓
5. Google redirects to: http://localhost:5000/api/auth/oauth/google/callback
   ↓
6. Backend processes OAuth and redirects to:
   http://localhost:3000/auth/callback?token=...&success=true&redirect=/marketplace
   ↓
7. Frontend handles callback and redirects user to /marketplace
```

---

## ⚙️ Backend OAuth Callback Handler

The backend **MUST** use the `FRONTEND_URL` environment variable:

```javascript
// Backend OAuth callback handler
router.get('/api/auth/oauth/google/callback', async (req, res) => {
  try {
    // ... process OAuth callback ...
    
    // Get frontend URL from environment
    const frontendUrl = process.env.FRONTEND_URL || 'https://tajaapp.shop';
    const redirectPath = state ? decodeURIComponent(state) : '/dashboard';
    
    // Redirect to frontend with tokens
    res.redirect(`${frontendUrl}/auth/callback?` +
      `token=${encodeURIComponent(token)}&` +
      `refreshToken=${encodeURIComponent(refreshToken)}&` +
      `success=true&` +
      `redirect=${encodeURIComponent(redirectPath)}`
    );
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://tajaapp.shop';
    res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error.message)}&redirect=/login`);
  }
});
```

---

## ✅ Quick Setup Checklist

### For Production

#### Frontend (Netlify)
- [x] `NEXT_PUBLIC_API_URL` set to `https://tajaapp-backend-nzkj.onrender.com` (already configured in `netlify.toml`)
- [x] Default fallback uses production URL

#### Backend (Render)
- [ ] Set `FRONTEND_URL=https://tajaapp.shop` in Render environment variables
- [ ] Set `BACKEND_URL=https://tajaapp-backend-nzkj.onrender.com`
- [ ] Configure Google OAuth redirect URI: `https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback`

### For Development

#### Frontend
- [ ] Create `.env.local` with:
  ```bash
  NEXT_PUBLIC_API_URL=http://localhost:5000
  ```

#### Backend
- [ ] Create `.env` with:
  ```bash
  FRONTEND_URL=http://localhost:3000
  BACKEND_URL=http://localhost:5000
  GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/oauth/google/callback
  ```
- [ ] Configure Google OAuth redirect URI: `http://localhost:5000/api/auth/oauth/google/callback`

---

## 🧪 Testing

### Test Production Setup

1. Visit: `https://tajaapp.shop`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Should redirect to: `https://tajaapp.shop/auth/callback?token=...&success=true`
5. Should then redirect to intended page (user logged in)

### Test Development Setup

1. Start backend: `cd backend && npm run dev` (runs on `localhost:5000`)
2. Start frontend: `cd frontend && npm run dev` (runs on `localhost:3000`)
3. Visit: `http://localhost:3000`
4. Click "Sign in with Google"
5. Complete Google authentication
6. Should redirect to: `http://localhost:3000/auth/callback?token=...&success=true`
7. Should then redirect to intended page (user logged in)

---

## 🚨 Common Issues

### Issue 1: OAuth redirects to wrong URL

**Problem**: Backend redirects to `localhost:5000` instead of frontend

**Solution**: Ensure `FRONTEND_URL` is set correctly in backend environment variables

### Issue 2: CORS errors

**Problem**: API calls blocked

**Solution**: Ensure backend CORS allows your frontend domain:
- Production: `https://tajaapp.shop`
- Development: `http://localhost:3000`

### Issue 3: Invalid redirect URI in Google OAuth

**Problem**: Google shows "redirect_uri_mismatch" error

**Solution**: Add both redirect URIs to Google OAuth Console:
- `https://tajaapp-backend-nzkj.onrender.com/api/auth/oauth/google/callback`
- `http://localhost:5000/api/auth/oauth/google/callback`

---

## 📝 Summary

| Environment | Frontend URL | Backend URL | FRONTEND_URL (Backend) |
|-------------|-------------|-------------|------------------------|
| **Production** | `https://tajaapp.shop` | `https://tajaapp-backend-nzkj.onrender.com` | `https://tajaapp.shop` |
| **Development** | `http://localhost:3000` | `http://localhost:5000` | `http://localhost:3000` |

**Key Points**:
- ✅ Frontend automatically uses production backend if no `.env.local`
- ✅ Backend **MUST** have `FRONTEND_URL` set correctly
- ✅ Google OAuth needs both production and development redirect URIs




