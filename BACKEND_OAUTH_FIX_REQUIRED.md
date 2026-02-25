# 🔧 Backend OAuth Fix Required

## 🚨 Current Problem

After Google OAuth authentication, the user is being redirected to:

```
http://localhost:5000/api/auth/oauth/google/callback?state=...&code=...
```

This is the **backend OAuth callback endpoint** (correct - this is where Google redirects).

**However**, the backend is NOT redirecting to the frontend, causing:

- ❌ `ERR_CONNECTION_REFUSED` error
- ❌ User stuck on backend URL instead of frontend
- ❌ OAuth flow incomplete

## ✅ Expected Behavior

### OAuth Flow (Correct)

```
1. User clicks "Sign in with Google" on frontend (localhost:3000)
   ↓
2. Frontend redirects to: http://localhost:5000/api/auth/google?redirect=/marketplace
   ↓
3. Backend redirects to: Google OAuth consent screen
   ↓
4. User approves on Google
   ↓
5. Google redirects to: http://localhost:5000/api/auth/oauth/google/callback?code=...&state=...
   ↓
6. Backend processes OAuth callback:
   - Exchanges code for tokens
   - Creates/updates user account
   - Generates JWT token
   ↓
7. Backend redirects to FRONTEND:
   http://localhost:3000/auth/callback?token=xxx&refreshToken=yyy&success=true&redirect=%2Fmarketplace
   ↓
8. Frontend callback handler processes tokens and redirects user to /marketplace
```

### What's Happening Now (Incorrect)

```
Step 7 is MISSING!
Backend receives callback but stays on localhost:5000 instead of redirecting to localhost:3000
```

## 🔧 Backend Fix Required

### 1. Ensure Environment Variable is Set

The backend **MUST** have this environment variable:

**For production (Render):**

```env
FRONTEND_URL=https://tajaapp.shop
BACKEND_URL=https://tajaapp-backend-nzkj.onrender.com
```

**For development (localhost):**

```env
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### 2. Backend OAuth Callback Handler

The backend OAuth callback handler (`/api/auth/oauth/google/callback`) should:

1. **Process the OAuth callback** (exchange code for tokens)
2. **Create/update user account**
3. **Generate JWT token and refresh token**
4. **Redirect to frontend** with tokens in URL

### 3. Example Backend Code (Express.js)

```javascript
// Backend OAuth callback handler
router.get("/api/auth/oauth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const redirectPath = state ? decodeURIComponent(state) : "/dashboard";

    // 1. Exchange code for tokens with Google
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. Get user info from Google
    const userInfo = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub: googleId } = userInfo.getPayload();

    // 3. Find or create user in database
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        fullName: name,
        avatar: picture,
        googleId,
        emailVerified: true,
        // ... other fields
      });
    } else {
      // Update existing user
      user.googleId = googleId;
      user.avatar = picture;
      user.emailVerified = true;
      await user.save();
    }

    // 4. Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    // 5. CRITICAL: Redirect to FRONTEND with tokens
    // Production: https://tajaapp.shop
    // Development: http://localhost:3000
    const frontendUrl = process.env.FRONTEND_URL || "https://tajaapp.shop";
    const redirectUrl =
      `${frontendUrl}/auth/callback?` +
      `token=${encodeURIComponent(token)}&` +
      `refreshToken=${encodeURIComponent(refreshToken)}&` +
      `success=true&` +
      `redirect=${encodeURIComponent(redirectPath)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth callback error:", error);

    // On error, redirect to frontend with error
    // Production: https://tajaapp.shop
    // Development: http://localhost:3000
    const frontendUrl = process.env.FRONTEND_URL || "https://tajaapp.shop";
    const errorMessage = error.message || "oauth_error";
    res.redirect(
      `${frontendUrl}/auth/callback?error=${encodeURIComponent(
        errorMessage
      )}&redirect=/login`
    );
  }
});
```

### 4. Key Points

#### ✅ Must Redirect to Frontend

```javascript
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
res.redirect(
  `${frontendUrl}/auth/callback?token=...&refreshToken=...&success=true&redirect=...`
);
```

#### ✅ Must Include All Required Parameters

- `token` - JWT access token (required)
- `refreshToken` - Refresh token (optional but recommended)
- `success=true` - Success indicator (required)
- `redirect` - Path to redirect after auth (encoded, e.g., `%2Fmarketplace`)

#### ✅ Must Handle Errors

```javascript
res.redirect(
  `${frontendUrl}/auth/callback?error=${encodeURIComponent(
    errorMessage
  )}&redirect=/login`
);
```

#### ✅ Must Use FRONTEND_URL Environment Variable

```javascript
// Production: https://tajaapp.shop
// Development: http://localhost:3000
const frontendUrl = process.env.FRONTEND_URL || "https://tajaapp.shop";
```

**NEVER hardcode the frontend URL!** Always use the environment variable.

### 5. State Parameter Handling

The `state` parameter from the OAuth request should contain the original redirect path:

```javascript
// When initiating OAuth (in /api/auth/google handler)
const state = req.query.redirect || "/dashboard";
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["email", "profile"],
  state: encodeURIComponent(state), // Pass redirect path in state
  redirect_uri: `${BACKEND_URL}/api/auth/oauth/google/callback`,
});

res.redirect(authUrl);
```

Then in the callback:

```javascript
const redirectPath = state ? decodeURIComponent(state) : "/dashboard";
```

## ✅ Frontend is Ready

The frontend callback handler is already created at:

- **File**: `src/app/auth/callback/page.tsx`
- **Route**: `/auth/callback`
- **Status**: ✅ Ready and waiting for tokens

## 🧪 Testing

### After Backend Fix

1. **Start Backend** (ensure `FRONTEND_URL=http://localhost:3000` is set)
2. **Start Frontend** (localhost:3000)
3. **Click "Sign in with Google"**
4. **Complete Google authentication**
5. **Should redirect to**: `http://localhost:3000/auth/callback?token=...&success=true&redirect=/marketplace`
6. **Should then redirect to**: `/marketplace` (user logged in)

### Verify Backend Environment

```bash
# Check backend .env file has:
FRONTEND_URL=http://localhost:3000
```

### Check Backend Logs

The backend should log:

```
✅ OAuth callback received
✅ User authenticated: user@example.com
✅ Redirecting to: http://localhost:3000/auth/callback?token=...
```

## 📋 Checklist for Backend Team

- [ ] Set `FRONTEND_URL=http://localhost:3000` in backend `.env`
- [ ] Verify OAuth callback handler redirects to `${FRONTEND_URL}/auth/callback`
- [ ] Include `token`, `refreshToken`, `success=true`, and `redirect` in redirect URL
- [ ] Handle errors by redirecting to frontend with error parameter
- [ ] Test complete OAuth flow end-to-end
- [ ] For production, set `FRONTEND_URL` to production frontend domain

## 🚨 Common Mistakes

### ❌ Mistake 1: Not Redirecting to Frontend

```javascript
// WRONG - stays on backend
res.json({ token, user });

// CORRECT - redirects to frontend
res.redirect(`${FRONTEND_URL}/auth/callback?token=...`);
```

### ❌ Mistake 2: Hardcoding Frontend URL

```javascript
// WRONG - hardcoded
res.redirect("http://localhost:3000/auth/callback?token=...");

// CORRECT - uses environment variable
res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=...`);
```

### ❌ Mistake 3: Missing Query Parameters

```javascript
// WRONG - missing success and redirect
res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

// CORRECT - includes all parameters
res.redirect(
  `${FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&success=true&redirect=${redirectPath}`
);
```

### ❌ Mistake 4: Not Encoding Parameters

```javascript
// WRONG - not encoded
res.redirect(`${FRONTEND_URL}/auth/callback?redirect=/marketplace`);

// CORRECT - properly encoded
res.redirect(
  `${FRONTEND_URL}/auth/callback?redirect=${encodeURIComponent("/marketplace")}`
);
```

## 📞 Support

Once the backend is fixed, the OAuth flow should work seamlessly. The frontend is ready and waiting for the redirect from the backend.
