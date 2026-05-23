# Taja — React Native / Expo API reference

Use this document to map **screens and UI actions** to **HTTP endpoints** on the Next.js backend. All paths are relative to your API base (e.g. `https://tajaapp.shop`).

**Convention**

- **JSON** bodies unless noted. Header: `Content-Type: application/json`.
- **Authenticated** calls: `Authorization: Bearer <accessToken>` where `<accessToken>` is the `token` returned from login, verify-email, or Google mobile sign-in. The server treats the scheme as **case-insensitive** (`bearer` and `Bearer` both work). If the header is missing, the server may use the **`token` cookie** from login (same JWT); native apps should still send the header because cookies are often not stored for API calls unless you enable a cookie jar.
- Most responses: `{ success: boolean, message?: string, data?: ... }`. Errors often use `message` with an HTTP status code.

---

## 1. Environment

| Variable (Expo / app config) | Purpose |
|------------------------------|---------|
| `API_BASE_URL` | Origin only, e.g. `https://tajaapp.shop` (no trailing slash). Used to build every endpoint below. |
| Google **Web** OAuth client ID | Same string as server `GOOGLE_CLIENT_ID` (OAuth type: **Web application**). Use as `webClientId` / `clientId` in expo-auth-session — **not** the Android/iOS native client ID unless you change server verification. |

**How to get the Taja “OAuth” API URL (for mobile)**

There are **two different URLs** in the Google flow:

| What | URL | Who calls it |
|------|-----|----------------|
| **Taja backend (your app calls this)** | `{API_BASE_URL}/api/v1/auth/google` | Your React Native app over HTTPS (`POST` + JSON body). Example: `https://tajaapp.shop/api/v1/auth/google`. |
| **Google OAuth / token** | `https://accounts.google.com/o/oauth2/v2/auth` (and token endpoints) | Handled **inside** `expo-auth-session` / `AuthSession` — you do **not** put this in `API_BASE_URL`. |

**Flow in one line:** Expo opens Google → user signs in → you read **`id_token`** from the response → **`POST`** that string to **`{API_BASE_URL}/api/v1/auth/google`**.

```text
Full Taja Google sign-in URL = EXPO_PUBLIC_API_BASE_URL + "/api/v1/auth/google"

Example:  https://tajaapp.shop/api/v1/auth/google
```

Use the **same** `API_BASE_URL` as login/register (one base, many paths).

---

### Google Cloud (one-time setup for mobile + server)

1. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** of type **Web application** (the one whose ID is already `GOOGLE_CLIENT_ID` on the Next server).
3. Under **Authorized redirect URIs**, add every URI Expo will use, for example:
   - **Custom scheme:** `com.yourcompany.taja:/oauthredirect` (match `scheme` in `app.json` / `app.config` — format is often `scheme:/path`).
   - **Expo Go / proxy:** `https://auth.expo.io/@your-expo-username/your-app-slug` (see current [Expo AuthSession docs](https://docs.expo.dev/guides/authentication/#google) for the exact redirect they generate).
   - Local dev if applicable: `http://localhost:8081` or whatever AuthSession uses in your setup.
4. Save. Redirect URI mismatches are the #1 reason `id_token` never appears.

The **Web client ID** string (ends in `.apps.googleusercontent.com`) is what you pass into Expo as the Google client ID. The server verifies `id_token` with that same ID as **audience** (`GOOGLE_CLIENT_ID` or `GOOGLE_WEB_CLIENT_ID` on Next).

---

### Expo: obtain `id_token`, then call Taja

1. Install and configure **`expo-auth-session`** (and **`expo-web-browser`** as needed per Expo SDK docs).
2. Create an auth request using the **Web** client ID from step above (`clientId` / `webClientId` per library API).
3. `promptAsync()` (or equivalent) → user completes Google sign-in.
4. From the success result, read the **ID token** (field name is often `id_token` or nested under `authentication` / `params` depending on SDK version — log the result once in dev to confirm).
5. **POST** to Taja:

```http
POST {API_BASE_URL}/api/v1/auth/google
Content-Type: application/json

{ "idToken": "<paste id_token here>", "role": "buyer" }
```

6. Store `response.data.token`, `response.data.refreshToken`, and `response.data.user` like email login.

**Axios example**

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // https://tajaapp.shop
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken(); // your SecureStore getter
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 2. UI → endpoint map (quick reference)

| UI / flow | Method | Path | Auth |
|-----------|--------|------|------|
| Sign up (email/password) | POST | `/api/auth/register` | No |
| Sign in (email/password) | POST | `/api/auth/login` | No |
| Sign in / sign up (Google, Expo) | POST | `/api/v1/auth/google` | No |
| Enter email verification code | POST | `/api/auth/verify-email` | No |
| Resend verification email | POST | `/api/auth/send-email-verification` | No |
| Add/update phone after verify | PUT | `/api/auth/profile` | Yes |
| Current user (full profile) | GET | `/api/users/me` | Yes |
| Update profile (name, phone, avatar, role…) | PUT | `/api/users/me` | Yes |
| Log out (invalidate refresh server-side) | POST | `/api/auth/logout` | Yes (Bearer + optional body) |
| Forgot password | POST | `/api/auth/forgot-password` | No |
| Reset password | POST | `/api/auth/reset-password` | No |
| Marketplace feed | GET | `/api/marketplace/feed` | Optional |
| Products list / search | GET | `/api/products?...` | Optional |
| Product by slug | GET | `/api/products/slug/:slug` | Optional |
| Cart | GET/POST | `/api/cart` | Cart often works with guest + merge |
| Wishlist | GET/POST/DELETE | `/api/wishlist` | Yes |
| Orders (buyer) | GET | `/api/orders` | Yes |
| Order detail | GET | `/api/orders/:id` | Yes |
| Checkout create order | POST | `/api/orders` | Yes |
| Addresses | GET/POST | `/api/users/addresses` | Yes |
| Seller: my shop | GET | `/api/shops/my` | Yes |
| Seller: dashboard | GET | `/api/seller/dashboard` | Yes |
| Select role (buyer/seller) | POST | `/api/users/select-role` | Yes |
| Wallet balance | GET | `/api/wallet/balance` | Yes |

Swagger UI (if deployed): `{API_BASE_URL}/docs/api`

---

## 3. Authentication (detailed)

### 3.1 Register — `POST /api/auth/register`

**UI:** Create account form (full name, email, password, role buyer/seller, terms).

**Body**

```json
{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "YourSecurePass1!",
  "role": "buyer",
  "referralCode": "OPTIONAL"
}
```

- `role`: `"buyer"` | `"seller"`.
- `phone` is optional at signup; collect after email verification if needed.

**Success (201)**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "...",
    "email": "ada@example.com",
    "emailSent": true
  },
  "emailSent": true
}
```

**Next UI step:** Navigate to **verify email** screen; optionally show message if `emailSent` is false.

---

### 3.2 Login — `POST /api/auth/login`

**UI:** Sign in form.

**Body**

```json
{
  "email": "ada@example.com",
  "password": "YourSecurePass1!",
  "rememberMe": true
}
```

**Success (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT access>",
    "refreshToken": "<JWT refresh>",
    "user": {
      "_id": "...",
      "fullName": "...",
      "email": "...",
      "phone": "...",
      "role": "buyer",
      "avatar": "...",
      "accountStatus": "active",
      "emailVerified": true,
      "phoneVerified": false
    }
  }
}
```

**Persist:** `data.token`, `data.refreshToken`, `data.user` (e.g. SecureStore + memory).

---

### 3.3 Verify email — `POST /api/auth/verify-email`

**UI:** 6-digit code + email field.

**Body**

```json
{
  "email": "ada@example.com",
  "code": "123456"
}
```

**Success (200)** — same session shape as login:

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "<JWT access>",
    "refreshToken": "<JWT refresh>",
    "user": { "_id": "...", "email": "...", "role": "...", ... }
  }
}
```

**Next UI step:** If user has no phone, show **add phone** → `PUT /api/auth/profile` (or `PUT /api/users/me`).

---

### 3.4 Resend verification code — `POST /api/auth/send-email-verification`

**UI:** “Resend code” on verify screen.

**Body**

```json
{ "email": "ada@example.com" }
```

Rate-limited per email / IP. Check `success` and `message`.

---

### 3.5 Google (Expo / expo-auth-session) — `POST /api/v1/auth/google`

**UI:** “Continue with Google”.

**Endpoint (copy-paste pattern)**

| Piece | Value |
|--------|--------|
| Method | `POST` |
| URL | `{API_BASE_URL}/api/v1/auth/google` |
| Auth header | None (token goes in JSON body as `idToken`) |
| Body | JSON — see below |

**Prerequisites (summary):** See **§1** above: Google **Web** client, redirect URIs for Expo, same client ID as server, then get **`id_token`** from AuthSession and POST it here.

**Body**

```json
{
  "idToken": "<Google id_token JWT string>",
  "role": "buyer"
}
```

- `role` optional; only applied for **new** users (`"buyer"` | `"seller"`).

**Success (200)** — same as login: `data.token`, `data.refreshToken`, `data.user`.

**Errors:** Often generic `message` with status `400` / `401` / `403` / `409` / `423` / `503`. Production requires HTTPS.

**You do not call** `/api/auth/google` (that starts the **web** browser redirect flow). Mobile uses **`/api/v1/auth/google`** only.

---

### 3.6 Profile / phone — `PUT /api/auth/profile`

**UI:** Add Nigerian phone after verification (or profile edit).

**Headers:** `Authorization: Bearer <token>`

**Body**

```json
{ "phone": "08012345678" }
```

Server normalizes/validates Nigerian numbers and checks duplicates.

**Success:** `{ success: true, data: { ...subset of user } }`

---

### 3.7 Current user — `GET /api/users/me`

**UI:** App launch, profile tab, refresh user.

**Headers:** `Authorization: Bearer <token>`

**Success:** `{ success: true, data: <user document> }` (password and sensitive fields stripped).

---

### 3.8 Update profile — `PUT /api/users/me`

**UI:** Edit profile, change role to seller, preferences.

**Headers:** `Authorization: Bearer <token>`

**Body (partial)**

```json
{
  "fullName": "...",
  "phone": "...",
  "avatar": "...",
  "coverPhoto": "...",
  "role": "seller",
  "preferences": { "emailNotifications": true }
}
```

`role`: `"buyer"` | `"seller"` updates `roleSelected` and may initialize KYC for sellers.

---

### 3.9 Logout — `POST /api/auth/logout`

**UI:** Sign out.

**Headers:** `Authorization: Bearer <token>`, optional `x-refresh-token` or body `{ "refreshToken": "..." }` if you store refresh tokens.

Clears server-side refresh entry when possible. Always clear local tokens on the client.

---

### 3.10 Forgot / reset password

| UI | Method | Path | Body |
|----|--------|------|------|
| Request reset link | POST | `/api/auth/forgot-password` | `{ "email": "..." }` |
| Submit new password | POST | `/api/auth/reset-password` | `{ "token": "...", "password": "..." }` (confirm field is client-only) |

Exact field names should match what the API route expects; inspect route or use `/docs/api` if documented.

---

## 4. Marketplace & catalog (typical buyer UI)

| UI | Method | Path | Notes |
|----|--------|------|------|
| Home / feed | GET | `/api/marketplace/feed` | Query params as supported by route |
| Search / list | GET | `/api/products` | e.g. `?search=&category=&page=` |
| Product detail | GET | `/api/products/slug/:slug` | Replace `:slug` |
| Featured | GET | `/api/products/featured` | |

---

## 5. Cart, wishlist, checkout

| UI | Method | Path | Auth |
|----|--------|------|------|
| Get cart | GET | `/api/cart` | Often guest-friendly; merge after login |
| Add to cart | POST | `/api/cart` | See route for body shape |
| Wishlist | GET/POST/DELETE | `/api/wishlist` | Yes |
| Place order | POST | `/api/orders` | Yes; body includes items, shipping, payment hints per API |
| My orders | GET | `/api/orders` | Yes |
| Order detail | GET | `/api/orders/:id` | Yes |

---

## 6. Addresses

| UI | Method | Path | Auth |
|----|--------|------|------|
| List | GET | `/api/users/addresses` | Yes |
| Create | POST | `/api/users/addresses` | Yes |
| Update/delete | PUT/DELETE | `/api/users/addresses/:id` | Yes |

---

## 7. Seller-specific (when `user.role === "seller"`)

| UI | Method | Path | Auth |
|----|--------|------|------|
| My shop | GET | `/api/shops/my` | Yes |
| Create/update shop | POST/PUT | `/api/shops` or `/api/shops/:shopId` | Yes |
| Seller dashboard | GET | `/api/seller/dashboard` | Yes |
| Seller products | GET/POST | `/api/seller/products` | Yes |
| KYC submit | POST | `/api/users/kyc/submit` | Yes |

---

## 8. Token refresh (if implemented on client)

If the app uses refresh tokens, add a route or pattern your web app uses (e.g. dedicated refresh endpoint). Many mobile clients call a **`POST /api/auth/refresh`**-style endpoint if present — **confirm in repo** or implement to match web. Until then, repeat login or Google exchange when access token expires.

---

## 9. Summary checklist for RN

1. Set **`API_BASE_URL`** to production/staging origin.
2. After **login**, **verify-email**, or **`/api/v1/auth/google`**, store **`data.token`** and **`data.refreshToken`**.
3. Attach **`Authorization: Bearer <token>`** to protected routes.
4. **Register** → **verify-email** → optional **PUT profile** (phone) → home.
5. **Google:** `idToken` → **`POST /api/v1/auth/google`** only (no change to web redirect OAuth).

---

*Generated for the Taja Next.js App Router API. For exhaustive route list, use OpenAPI/Swagger at `/docs/api` and `src/openapi/openapi.json` where applicable.*
