# CORS Fix Required - "Failed to fetch" Error

## 🚨 Problem

After OAuth authentication, users are getting:

```
OAuth error: ApiError: Failed to fetch
```

This is a **CORS (Cross-Origin Resource Sharing) error** - the backend is not allowing requests from the frontend domain.

## 🔍 Root Cause

When the frontend tries to fetch user data from:

```
https://tajaapp-backend-nzkj.onrender.com/api/users/me
```

The browser blocks the request because:

1. Frontend is on: `https://tajaapp.shop`
2. Backend is on: `https://tajaapp-backend-nzkj.onrender.com`
3. Different origins = CORS required

## ✅ Backend Fix Required

### 1. Enable CORS for Frontend Domain

The backend **MUST** allow requests from `https://tajaapp.shop`.

**Example Express.js CORS configuration:**

```javascript
const cors = require("cors");

const corsOptions = {
  origin: [
    "https://tajaapp.shop", // Production frontend
    "http://localhost:3000", // Development frontend
    "https://tajaapp-frontend.netlify.app", // If using Netlify
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
```

### 2. Environment-Based CORS

Better approach - use environment variables:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL, // https://tajaapp.shop
  "http://localhost:3000", // Development
  // Add any other allowed origins
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
```

### 3. Preflight OPTIONS Requests

Make sure the backend handles OPTIONS requests:

```javascript
// Handle preflight requests
app.options("*", cors(corsOptions));
```

### 4. Authorization Header

Ensure the backend allows the `Authorization` header:

```javascript
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization", // ← CRITICAL: Must allow this
      "X-Requested-With",
    ],
  })
);
```

## 🔧 Quick Test

### Test CORS from Browser Console

Open browser console on `https://tajaapp.shop` and run:

```javascript
fetch("https://tajaapp-backend-nzkj.onrender.com/api/users/me", {
  headers: {
    Authorization: "Bearer YOUR_TOKEN_HERE",
  },
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

**If you see CORS error:**

- Backend CORS is not configured correctly
- Fix backend CORS configuration

**If you see 401/403:**

- CORS is working, but token is invalid
- This is a different issue

## 📋 Backend Checklist

- [ ] CORS middleware installed (`cors` package)
- [ ] CORS configured to allow `https://tajaapp.shop`
- [ ] `Authorization` header allowed in CORS config
- [ ] `credentials: true` set in CORS config
- [ ] OPTIONS requests handled for preflight
- [ ] Tested CORS from production frontend domain

## 🚀 Temporary Workaround (Frontend)

I've updated the frontend to handle network errors gracefully:

1. **Detects network/CORS errors**
2. **Proceeds with temporary user data** (assumes new user)
3. **Redirects to role selection** (user can complete profile)
4. **AuthContext will retry** fetching user data on next page load

However, **this is not a permanent solution**. The backend **MUST** fix CORS for the app to work properly.

## 🔍 Debugging

### Check Backend CORS Headers

Use curl to check if CORS headers are present:

```bash
curl -H "Origin: https://tajaapp.shop" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     https://tajaapp-backend-nzkj.onrender.com/api/users/me \
     -v
```

**Expected response headers:**

```
Access-Control-Allow-Origin: https://tajaapp.shop
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Check Browser Network Tab

1. Open browser DevTools → Network tab
2. Try OAuth flow
3. Look for the failed request to `/api/users/me`
4. Check the error message:
   - **CORS error**: "Access to fetch at ... has been blocked by CORS policy"
   - **Network error**: "Failed to fetch" (could be CORS or network issue)

## 📝 Summary

**The "Failed to fetch" error is a CORS issue.**

**Backend must:**

1. ✅ Allow `https://tajaapp.shop` in CORS origins
2. ✅ Allow `Authorization` header
3. ✅ Handle OPTIONS preflight requests
4. ✅ Set `credentials: true`

**Frontend has been updated to:**

- ✅ Handle network errors gracefully
- ✅ Proceed with temporary user data
- ✅ Allow user to complete profile even if fetch fails
- ✅ Retry fetching user data on next page load

**But the backend CORS fix is still required for full functionality.**
