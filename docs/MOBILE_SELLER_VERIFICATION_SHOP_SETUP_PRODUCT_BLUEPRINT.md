# Mobile Blueprint: Seller Verification, Shop Setup, and Add Product

This document explains how the current web seller flows work and how to implement them cleanly in React Native:

1. Seller verification UI
2. Shop setup UI
3. Add product UI

It includes:
- exact endpoints consumed
- auth rules
- request/response contracts
- mobile UI state mapping
- refactor recommendations (API + client architecture)

---

## 1) Global Auth + API Contract

### Canonical auth header

All protected routes should be called with:

`Authorization: Bearer <access_token>`

Token can come from login response and should be persisted on mobile (SecureStore/Keychain).  
Most routes use backend auth middleware (`requireAuth` / `requireRole`), so missing or invalid token returns 401.

### Common response envelope

Most routes follow:

```json
{
  "success": true,
  "message": "optional",
  "data": {}
}
```

On error:

```json
{
  "success": false,
  "message": "Error reason"
}
```

### Mobile HTTP client recommendation

- Centralize all calls in one `apiClient` (axios/fetch wrapper)
- Auto-inject bearer token
- Normalize server errors into a single error shape
- Avoid route-level ad-hoc `fetch` in screens/components

---

## 2) Seller Verification UI (Mobile)

Web source: `src/app/seller/verification/page.tsx`

## 2.1 Screen flow

The web flow is 3 steps:

1. **Identity**: NIN input + validation, business type
2. **Selfie**: capture/upload selfie image
3. **Documents**: optional supporting docs upload + submit KYC

Important current behavior:
- NIN is validated via `POST /api/verify/identity` when 11 digits are entered
- Final KYC is submitted via `POST /api/users/kyc/submit`
- Images selected in step 2/3 are currently not submitted to KYC endpoint (UI-only in current web implementation)

## 2.2 Endpoints consumed

### `POST /api/verify/identity`

Purpose: real-time identity verification (NIN/passport/etc).

Auth: required  
Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`

Request:

```json
{
  "idType": "nin",
  "idNumber": "12345678901",
  "firstName": "Amina",
  "lastName": "Yusuf"
}
```

Success response:

```json
{
  "success": true,
  "verified": true,
  "requiresManualVerification": false,
  "data": {
    "fullName": "AMINA YUSUF"
  },
  "provider": "dojah",
  "message": "Identity verified successfully via Dojah"
}
```

Validation errors:
- `400` invalid/missing `idType` or `idNumber`

---

### `POST /api/users/kyc/submit`

Purpose: submit seller KYC profile.

Auth: required  
Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`

Request (current web usage):

```json
{
  "businessName": "Business Account",
  "businessType": "registered_business",
  "businessRegistrationNumber": null,
  "idType": "national_id",
  "idNumber": "12345678901",
  "bankName": "Pending",
  "accountNumber": "0000000000",
  "accountName": "Amina Yusuf",
  "bankVerificationNumber": null
}
```

Success response:

```json
{
  "success": true,
  "message": "KYC information submitted successfully. We will review it shortly.",
  "data": {
    "status": "pending",
    "submittedAt": "2026-04-06T10:00:00.000Z"
  }
}
```

Validation errors:
- `400` when required fields missing
- `404` user not found

## 2.3 Mobile UI state mapping

- `idle` -> initial form
- `validatingIdentity` -> show spinner while `verify/identity` in flight
- `identityVerified` / `identityFailed`
- `submittingKyc` -> disable submit button
- `submittedPendingReview` -> navigate to seller dashboard / success screen

## 2.4 Verification refactor recommendations

### Backend

1. Add dedicated KYC document upload contract:
   - either extend `/api/users/kyc/submit` with `documents[]`
   - or add `/api/users/kyc/documents` for selfie/NIN image upload
2. Enforce stable enum for `businessType` (`individual | registered_business`)
3. Return a typed KYC status object from `/api/users/me` for easier mobile gating

### Mobile

1. Split into 3 RN screens (or one screen with pager) but keep one store:
   - `kycIdentity`
   - `kycSelfie`
   - `kycDocuments`
2. Persist draft progress locally (AsyncStorage) in case app closes mid-flow
3. Do not block form progression on optional docs

---

## 3) Shop Setup UI (Mobile)

Web source: `src/app/seller/setup/page.tsx`

## 3.1 Screen flow

3-step wizard:

1. **Shop Info**: name, slug, description, categories
2. **Business**: business type + social links
3. **Settings**: response time + return policy

Before showing setup:
- web calls `/api/shops/my`
- if shop exists, user is redirected to seller dashboard (one-shop-per-user rule)

## 3.2 Endpoints consumed

### `GET /api/shops/my`

Purpose: check if current user already has a shop.

Auth: required

Success response (no shop):

```json
{
  "success": true,
  "data": null
}
```

Success response (has shop):

```json
{
  "success": true,
  "data": {
    "_id": "shopId",
    "shopName": "Amina Store",
    "status": "pending"
  }
}
```

---

### `POST /api/shops`

Purpose: create shop profile.

Auth: required  
Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`

Current web payload:

```json
{
  "shopName": "Amina Store",
  "shopSlug": "amina_store",
  "description": "Shop description",
  "categories": ["Fashion", "Shoes"],
  "businessInfo": {
    "businessType": "individual",
    "businessName": "",
    "businessAddress": ""
  },
  "socialLinks": {
    "instagram": "amina",
    "whatsapp": "234812345678",
    "twitter": "",
    "facebook": ""
  },
  "settings": {
    "responseTime": "within-day",
    "returnPolicy": "No returns accepted"
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Shop created successfully. It is now under review. You will not see the setup page again.",
  "data": {
    "_id": "shopId",
    "shopName": "Amina Store",
    "status": "pending"
  }
}
```

Known business rules:
- one shop per user (409 with `SHOP_ALREADY_EXISTS`)
- slug must be unique
- if user KYC already approved, shop can auto-activate

## 3.3 Shop setup refactor recommendations

### Backend

1. Align request shape to one contract:
   - accept `categories` (array) and persist consistently
   - avoid ambiguity between `category` and `categories`
2. Add slug validator endpoint:
   - `GET /api/shops/slug-availability?slug=...`
3. Return a minimal canonical `ShopSetupResult` object to reduce mobile parsing logic

### Mobile

1. Use debounced slug generation + availability check
2. Build `ShopSetupDraft` object and submit once at final step
3. Keep social links optional; validate WhatsApp format if present

---

## 4) Add Product UI (Mobile)

Web source: `src/app/seller/products/new/page.tsx`

## 4.1 Gating and prerequisites

Before allowing product creation:

1. `GET /api/shops/my` -> must exist
2. user KYC status must be approved (web checks `user.kyc.status === "approved"`)
3. categories loaded via `GET /api/seller/categories`

## 4.2 Endpoints consumed

### `GET /api/shops/my`

Used for "has shop" gate.

### `GET /api/seller/categories`

Purpose: fetch available categories for seller product form.

Auth: seller/admin required.

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "categoryId",
      "name": "Fashion",
      "slug": "fashion"
    }
  ]
}
```

### `POST /api/upload` (for product images)

Purpose: upload image files and get CDN/R2 URL.

Auth: required  
Content-Type: multipart/form-data

FormData fields:
- `file`: binary image
- `type`: `"product"`

Success response:

```json
{
  "success": true,
  "data": {
    "url": "https://cdn.../products/file.jpg",
    "key": "products/file.jpg",
    "filename": "file.jpg",
    "size": 123456,
    "type": "image/jpeg"
  }
}
```

Validation:
- only image types (`jpeg/png/webp/gif`)
- max 10MB

### `POST /api/products`

Purpose: create product.

Auth: seller/admin required.

Minimum required fields (backend):
- `title`
- `description`
- `category`
- `price`
- `images[]` (at least one)

Typical web payload:

```json
{
  "title": "Vintage Denim Jacket",
  "description": "Clean, premium quality",
  "category": "categoryId_or_name",
  "condition": "good",
  "price": 15000,
  "compareAtPrice": 18000,
  "images": ["https://..."],
  "inventory": {
    "quantity": 10,
    "sku": "VDJ-001",
    "trackQuantity": true,
    "moq": 1
  },
  "shipping": {
    "weight": 0.8,
    "freeShipping": false,
    "shippingCost": 1500,
    "costPerKg": 1200,
    "processingTime": "1-2-days"
  },
  "specifications": {
    "size": "M",
    "color": "Blue"
  },
  "seo": {
    "tags": ["denim", "jacket", "vintage"]
  },
  "variants": [
    {
      "name": "Blue / M",
      "price": 15000,
      "stock": 5,
      "weight": 0.8,
      "image": "https://..."
    }
  ],
  "status": "active"
}
```

Success response:

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "productId"
  }
}
```

Business rule:
- if seller has no shop, API returns `403` with code `SHOP_REQUIRED`

## 4.3 Add product UI state mapping

- `checkingPrerequisites`
- `loadingCategories`
- `uploadingImages`
- `savingDraft`
- `publishing`
- `success`
- `error`

Keep two submit actions:
- `Save Draft` -> `status: "draft"`
- `Publish` -> `status: "active"`

## 4.4 Add product refactor recommendations

### Backend

1. Introduce schema-first validation (zod/joi) for `POST /api/products`
2. Return field-level validation errors (`errors: { field: message }`)
3. Canonicalize `category` to ObjectId only (remove mixed id/name ambiguity)
4. Add dedicated endpoint for draft autosave:
   - `POST /api/seller/products/draft`
   - `PUT /api/seller/products/:id/draft`

### Mobile

1. Use local "draft product" store + autosave
2. Upload images first, then submit final payload with URLs
3. Keep variants as first-class form objects with local IDs
4. Build typed models:
   - `ProductFormDraft`
   - `VariantDraft`
   - `InventoryInput`
   - `ShippingInput`

---

## 5) Suggested Mobile Architecture (Refactor Plan)

## 5.1 Folder structure

```txt
mobile/
  src/
    features/sellerVerification/
      screens/
      api.ts
      types.ts
      store.ts
    features/shopSetup/
      screens/
      api.ts
      types.ts
      store.ts
    features/productCreate/
      screens/
      api.ts
      types.ts
      store.ts
    shared/api/
      client.ts
      auth.ts
      errors.ts
```

## 5.2 Shared API rules

- One HTTP client with interceptors for:
  - auth token injection
  - 401 refresh/logout handling
  - error normalization
- Retry only idempotent GETs
- Upload helper returns strict `UploadedAsset` model

## 5.3 Typed contracts for RN

Use explicit interfaces for all request/response payloads so screens do not parse raw JSON ad hoc.

---

## 6) Implementation Order for Mobile Team

1. Build shared API client + auth integration
2. Implement `GET /api/shops/my` gate in seller area
3. Implement seller verification flow (`verify/identity` + `kyc/submit`)
4. Implement shop setup wizard (`POST /api/shops`)
5. Implement add-product flow (`seller/categories`, `upload`, `products`)
6. Add draft persistence + offline-safe resume
7. Add analytics/events on each step completion

---

## 7) Quick Testing Checklist

1. Valid token + NIN verify -> `verified=true` response
2. KYC submit -> returns `success=true`, `status=pending`
3. Shop setup without existing shop -> 201 success
4. Shop setup with existing shop -> 409 `SHOP_ALREADY_EXISTS`
5. Product upload image -> receives `data.url`
6. Product create with missing required fields -> 400
7. Product create with no shop -> 403 `SHOP_REQUIRED`
8. Product publish with variants -> product contains variants in response

---

## 8) Known Gaps Today (Important)

1. Verification selfie/supporting docs are not currently persisted by the KYC submit endpoint (UI collects them, backend payload does not include them).
2. Shop payload shape in UI/backend has slight mismatch risk (`categories` array vs backend destructuring `category`).
3. Product creation route accepts category by name or ObjectId; mobile should prefer ObjectId to avoid ambiguity.

These should be addressed as part of the refactor plan above before scaling mobile seller onboarding.

