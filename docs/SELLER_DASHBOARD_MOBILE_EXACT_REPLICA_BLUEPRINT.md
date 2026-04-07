# Seller Dashboard Mobile Exact Replica Blueprint

This document is the **1:1 parity checklist** for mobile to match web seller experience.

You called out missing items on mobile (referral code, social links, wallet funding).  
They are all present in web flows and should be added to mobile seller shell.

---

## 1) What is missing on mobile (must be added)

1. **Referral center**
   - Seller should see referral code + referral link + referred users + earned/pending rewards.
2. **Shop social links editor**
   - Seller should be able to add/edit Instagram, TikTok, WhatsApp, Twitter/X, Facebook, Website, YouTube, LinkedIn.
3. **Wallet funding**
   - Seller should be able to enter amount and start wallet top-up flow.

If the goal is exact web replica, these must be first-class screens in seller mobile.

---

## 2) Proof from current web app

The seller routes already expose these experiences:

- `src/app/seller/referrals/page.tsx` -> reuses buyer referrals UI (`/dashboard/referrals`).
- `src/app/seller/wallet/page.tsx` -> reuses buyer wallet UI (`/dashboard/wallet`).
- `src/app/seller/shop/edit/page.tsx` -> dedicated shop profile + social links editor.
- `src/app/seller/profile/page.tsx` -> reuses profile UI.
- `src/app/seller/settings/page.tsx` -> reuses settings UI.

So mobile parity is a frontend scope gap, not a backend gap.

---

## 3) Mobile information architecture (exact-replica recommendation)

Seller app should include:

## Bottom tabs

1. Overview
2. Orders
3. Products
4. Analytics
5. Account

## Account stack (required for parity)

- Shop Profile (edit + social links)
- Wallet (balance + fund wallet)
- Referrals (code/link/stats/referred users)
- Profile
- Settings
- Verification
- Logistics
- Categories
- Addresses / Purchases / Wishlist (already in seller shell concept)

---

## 4) Endpoint map for missing features

## 4.1 Referrals (missing on mobile)

### `GET /api/referrals/me`

Use for:

- `referralCode`
- summary stats (`referredUsers`, `earned`, `pending`)

### `GET /api/referrals/referred-users`

Use for:

- list of referred users for the referrals screen table/list.

### `POST /api/referrals/apply`

Use for:

- applying a referral code from another user.

Body:

```json
{ "code": "ABC123" }
```

---

## 4.2 Shop social links + seller-facing public profile data

### `GET /api/shops/my`

Use for prefill:

- `shopName`, `description`, `about`, `tagline`
- `logo`, `banner`, `avatar`, `coverImage`
- `socialLinks.*`
- `settings.returnPolicy`, `settings.responseTime`

### `POST /api/upload` (for logo/banner)

`multipart/form-data`:

- `file`
- `type`: `logo` or `banner`

### `PUT /api/shops/:shopId`

Use to save shop profile changes, including:

- identity fields (`shopName`, `description`, `about`, `tagline`)
- branding (`logo`, `banner`, `avatar`, `coverImage`)
- social links object:
  - `instagram`
  - `tiktok`
  - `whatsapp`
  - `twitter`
  - `facebook`
  - `website`
  - `youtube`
  - `linkedin`
- settings subset (`returnPolicy`, `responseTime`)

---

## 4.3 Wallet funding (missing on mobile)

### `GET /api/wallet/balance`

Use for:

- available balance
- held/escrow balance

### `GET /api/wallet/transactions?limit=25`

Use for:

- transaction history list.

### `POST /api/wallet/fund`

Use for:

- initializing wallet top-up payment.

Body:

```json
{ "amount": 2000 }
```

Response includes payment URL (`data.paymentUrl`) to open in webview/browser.

### `GET /api/users/me` (wallet screen helper)

Use for:

- reward points display shown on wallet screen.

---

## 5) Mobile UI requirements (exact parity level)

## 5.1 Referrals screen

Must show:

- referral link (copy/share)
- referral code (copy)
- referred users count
- earnings summary
- referred users list
- optional apply-code card

## 5.2 Shop Profile screen

Must show/edit:

- shop identity fields
- logo + banner upload
- full social links form
- return policy + response time fields
- save action
- optional share shop button (from `shopSlug`)

## 5.3 Wallet screen

Must show:

- available balance card
- held escrow card
- reward points
- amount input for funding
- “Fund wallet” CTA
- transactions history list

---

## 6) Navigation entry points (where mobile should expose them)

To match web behavior, expose these from seller account menu:

- **Referrals** -> Seller Account stack
- **Wallet** -> Seller Account stack (or tab shortcut)
- **Shop Profile** -> Seller Management stack

Recommended quick links from seller overview:

- “Fund Wallet”
- “Edit Shop Profile”
- “Referral Program”

---

## 7) Minimal parity acceptance checklist

A seller mobile build is considered “web-parity ready” when:

1. Seller can open referrals and copy/share code/link.
2. Seller can fund wallet and see transactions/balance.
3. Seller can edit and save social links in shop profile.
4. Seller can upload shop logo/banner from mobile.
5. All above use bearer auth and shared API error handling.

---

## 8) Notes for engineering handoff

- These capabilities already exist on backend and web UI; implement as mobile composition of existing endpoints.
- No backend contract change is required for the three missing features.
- Prioritize these before adding net-new seller features to avoid parity drift.
