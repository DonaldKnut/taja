# Backend Fix Guide: KYC Submit "Session Validation Failed"

This guide explains how backend should fix KYC auth failures where mobile sends a valid bearer token but `POST /api/users/kyc/submit` responds with session/login-style errors.

---

## Problem

Mobile sends:

- `Authorization: Bearer <access_token>`

But backend sometimes returns:

- "Session validation failed on this endpoint"
- login-style messages (email/password wording)

That usually means the endpoint is not consistently using token middleware, or auth errors are being mapped incorrectly.

---

## Target Endpoints

- `POST /api/users/kyc/submit`
- `POST /api/verify/identity`

Both must accept bearer token auth reliably.

---

## Required Contract

### Request

- Method: `POST`
- Header: `Authorization: Bearer <jwt>`
- Header: `Content-Type: application/json`

### Auth failure responses (standardized)

Missing token:

```json
{
  "ok": false,
  "code": "AUTH_REQUIRED",
  "message": "Authentication required"
}
```

Invalid/expired token:

```json
{
  "ok": false,
  "code": "INVALID_TOKEN",
  "message": "Access token is invalid or expired"
}
```

Do not return login-specific copy on protected routes.

---

## Fix Strategy

## 1) Force route-level auth via bearer token parser

Each protected route should do:

1. Parse auth header
2. Validate `Bearer <token>`
3. Verify JWT
4. Resolve user context
5. Continue business logic

If auth fails, return the standard code/message above.

---

## 2) Use one auth utility everywhere

Create/use one shared function (example: `authenticate(request)`) used by:

- `requireAuth`
- `requireRole`
- directly in sensitive routes where custom auth response shape is required

This avoids route-to-route drift.

---

## 3) Remove session-only assumptions for mobile API routes

Protected API routes must not require browser session cookie when bearer token is present.  
Cookie fallback is fine, but bearer must remain first-class for mobile.

---

## 4) Keep generic auth middleware from mapping to login copy

Never map auth failures on protected API routes to login UI strings like:

- "check email and password"

That message is only valid on login endpoint itself.

---

## 5) Verify infra forwards `Authorization`

If using CDN/proxy/serverless edge, ensure `Authorization` header is not stripped.

Check:

- ingress/proxy rules
- edge functions
- CORS preflight for browser clients (if applicable)
- logs at API boundary (mask token value; only log presence)

---

## Next.js Reference Implementation

```ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  const { user, error } = await authenticate(request);

  if (!user) {
    const code = error === "Unauthorized: invalid token" ? "INVALID_TOKEN" : "AUTH_REQUIRED";
    const message =
      code === "INVALID_TOKEN"
        ? "Access token is invalid or expired"
        : "Authentication required";

    return NextResponse.json({ ok: false, code, message }, { status: 401 });
  }

  // continue route logic...
  return NextResponse.json({ ok: true });
}
```

---

## KYC Submit Expected Success Shape

Recommended to keep backward compatibility while adding mobile-friendly fields:

```json
{
  "success": true,
  "ok": true,
  "message": "KYC information submitted successfully. We will review it shortly.",
  "kycStatus": "pending",
  "data": {
    "status": "pending",
    "submittedAt": "2026-04-06T12:00:00.000Z"
  }
}
```

---

## Deployment Checklist

1. Merge and deploy auth fix on backend service actually serving mobile traffic.
2. Confirm deployed commit includes KYC and identity routes updates.
3. Run smoke test with real mobile token:
   - `POST /api/users/kyc/submit` -> success/pending
4. Run missing-token test:
   - expect `401` + `AUTH_REQUIRED`
5. Run expired-token test:
   - expect `401` + `INVALID_TOKEN`
6. Confirm no "email/password" copy appears on these endpoints.

---

## API QA Test Matrix

### Valid token

- Request includes bearer token
- Expected: `200`, `ok: true`, `kycStatus: pending`

### Missing token

- No `Authorization` header
- Expected: `401`, `code: AUTH_REQUIRED`

### Malformed token

- `Authorization: Bearer abc`
- Expected: `401`, `code: INVALID_TOKEN`

### Expired token

- Old JWT
- Expected: `401`, `code: INVALID_TOKEN`

---

## Notes for Mobile Team

- Always send bearer token explicitly for KYC routes.
- Handle auth failures by `code` (not by free-text message):
  - `AUTH_REQUIRED` -> login
  - `INVALID_TOKEN` -> refresh or relogin

