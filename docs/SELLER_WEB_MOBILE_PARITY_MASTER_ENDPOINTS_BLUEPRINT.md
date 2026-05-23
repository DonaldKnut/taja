# Seller Web -> Mobile Parity Master Blueprint (Pages + Endpoints)

This is the master implementation map for making seller mobile match seller web.

It covers the exact nav structure you listed and maps each page to:

- primary endpoint(s)
- sub-endpoints/actions
- notes needed for mobile parity

---

## 1) Seller navigation structure (web parity target)

## Seller Dashboard group

1. Overview
2. Marketplace
3. Products
4. Categories
5. Orders
6. Logistics
7. Analytics
8. Account

## Account subgroup

1. Wallet
2. Orders (Purchases)
3. Addresses
4. Referrals
5. Wishlist

## Management subgroup

1. Setup
2. Shop Profile
3. Verification
4. Profile
5. Settings

---

## 2) Master endpoint matrix by page

## A) Seller Dashboard Group

## A1. Overview (`/seller/dashboard`)

### Primary

- `GET /api/seller/dashboard`
- `GET /api/shops/my`

### Linked actions from overview cards

- `GET /api/orders?role=seller&limit=...` (recent orders view)
- `GET /api/seller/products?...` (inventory pointers)

---

## A2. Marketplace (`/seller/marketplace`)

Uses marketplace feed component. Main data source:

- `GET /api/marketplace/feed?category&search&shop&seller&minPrice&maxPrice&verifiedOnly&limit&userId&includeMine`

Related deep-link data screens use:

- `GET /api/products?...`
- `GET /api/shops?...`
- `GET /api/search?...` (where search module is used)

---

## A3. Products (`/seller/products`)

### Primary list

- `GET /api/seller/products?limit&page&status&search&category`

### Item actions

- `DELETE /api/products/:productId`
- `GET /api/products/:productId` (for preview/detail)

### Create/Edit flows linked from this section

- `POST /api/products`
- `PUT /api/products/:productId`
- `POST /api/upload` (product media)
- `GET /api/seller/categories` (category picker in create flow)
- `GET /api/categories` and `GET /api/categories/:id/subcategories` (advanced upload/edit flows)
- AI assists:
  - `POST /api/ai/generate-description`
  - `POST /api/ai/suggest-tags`
  - `POST /api/ai/analyze-image` (edit flow)

---

## A4. Categories (`/seller/categories`)

### Primary

- `GET /api/seller/categories`

### Create

- `POST /api/seller/categories`

---

## A5. Orders (`/seller/orders`)

### Primary list

- `GET /api/orders?role=seller&limit&page&status`

### Status update actions

- `PATCH /api/orders/:id/status`

### Detail page (`/seller/orders/:id`)

- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`

---

## A6. Logistics (`/seller/logistics`)

This page combines shipment monitoring + shop delivery configuration.

### Shipment/tracking side

- `GET /api/orders?role=seller&limit&page&status`
- `GET /api/tracking/order/:orderId` (tracking history timeline)

### Delivery configuration side

- `GET /api/shops/my`
- `PUT /api/shops/:shopId` (save delivery fee, pickup points, global rules, slots, tiers)

### AI policy helpers used in logistics page

- `POST /api/ai/shop-policies` (returns/shipping policy drafts)

---

## A7. Analytics (`/seller/analytics`)

### Primary (used by web analytics page)

- `GET /api/seller/analytics?period=7d|30d|90d|1y|all`

### Secondary/fallback (shop-scoped analytics summary)

- `GET /api/shops/:shopId/analytics?period=...`

---

## A8. Account (entry container in seller shell)

Account menu links into Wallet, Purchases, Addresses, Referrals, Wishlist, Profile, Settings.

No dedicated endpoint for account container; uses subpage endpoints below.

---

## B) Account Subgroup

## B1. Wallet (`/seller/wallet`)

(`seller/wallet` reuses `dashboard/wallet` UI)

- `GET /api/wallet/balance`
- `GET /api/wallet/transactions?limit=...`
- `POST /api/wallet/fund`
- `GET /api/users/me` (reward points shown in wallet UI)

---

## B2. Orders / Purchases (`/seller/purchases`)

(`seller/purchases` maps to buyer-style orders page under seller shell)

- `GET /api/orders?role=buyer&limit&page&status`
- `GET /api/orders/:id`
- `POST /api/orders/:id/confirm-delivery` (when user confirms delivery from purchase detail)
- `POST /api/payments/payout` (where payout release flow is exposed)

---

## B3. Addresses (`/seller/addresses`)

(`seller/addresses` reuses dashboard addresses UI)

- `GET /api/users/addresses`
- `POST /api/users/addresses`
- `PUT /api/users/addresses/:id`
- `DELETE /api/users/addresses/:id`

---

## B4. Referrals (`/seller/referrals`)

(`seller/referrals` reuses dashboard referrals UI)

- `GET /api/referrals/me`
- `GET /api/referrals/referred-users`
- `POST /api/referrals/apply`

---

## B5. Wishlist (`/seller/wishlist`)

(`seller/wishlist` reuses dashboard wishlist UI/store behavior)

- `GET /api/wishlist`
- `DELETE /api/wishlist/:productId`
- `POST /api/wishlist` (add flow, depending on action source)

---

## C) Management Subgroup

## C1. Setup (`/seller/setup`)

- `GET /api/shops/my` (gate: one shop per user)
- `POST /api/shops` (create shop)

---

## C2. Shop Profile (`/seller/shop/edit`)

- `GET /api/shops/my`
- `PUT /api/shops/:shopId`
- `POST /api/upload` (logo/banner uploads)

Key fields editable here include social links:

- instagram, tiktok, whatsapp, twitter, facebook, website, youtube, linkedin

---

## C3. Verification (`/seller/verification`)

- `POST /api/verify/identity`
- `POST /api/users/kyc/submit`

---

## C4. Profile (`/seller/profile`)

(`seller/profile` reuses dashboard profile UI)

- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/addresses`
- `POST /api/users/avatar`
- `DELETE /api/users/avatar`
- `GET /api/users/export`
- `DELETE /api/users/me`
- `POST /api/upload` (avatar/cover upload helper path)

---

## C5. Settings (`/seller/settings`)

(`seller/settings` reuses dashboard settings UI)

- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/password`
- `PUT /api/users/notifications`
- `POST /api/upload` (avatar upload)
- `POST /api/users/avatar`
- `DELETE /api/users/avatar`
- `DELETE /api/users/me`

---

## 3) Cross-cutting seller shell dependencies

These are used by seller layout/app-shell for parity:

- `GET /api/shops/my` (sidebar CTA gating and setup status)
- Notifications:
  - `GET /api/notifications`
  - `PUT /api/notifications/:id`
  - `PUT /api/notifications/mark-all-read`
  - `DELETE /api/notifications/:id`
  - `DELETE /api/notifications/clear-all`
  - `GET /api/notifications/stream` (SSE)
- Search modal/global search:
  - `GET /api/search?...` (where search modal is active)

---

## 4) Mobile implementation notes (to keep web parity)

1. Preserve role-based shell and route guards (seller-only screens under seller nav).
2. Reuse the same endpoint contracts; avoid introducing alternative payloads unless additive.
3. Mirror web subpages as actual mobile screens, not hidden links:
   - Wallet, Referrals, Shop Profile are parity-critical.
4. Maintain consistent status enums and period filters:
   - analytics periods: `7d`, `30d`, `90d`, `all` (backend also supports `1y`).
5. Keep notifications and search available from seller shell header.

---

## 5) Parity-ready checklist

A seller mobile build is considered web-parity ready when all pages above are implemented and each page can load/save using the mapped endpoints without fallback-only behavior.

