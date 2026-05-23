# Dashboard Mobile UI, Endpoints, and Notification Coverage Blueprint

This blueprint documents:

1. Current dashboard architecture on web.
2. How mobile should mirror dashboard UX.
3. Exact endpoint groups to consume.
4. Where users are routed to dashboard in current UI.
5. Notification coverage audit (including an IG metric) and push capability status.

---

## 1) Current dashboard surfaces on web

There are 3 dashboard contexts:

1. **Buyer dashboard** (`/dashboard/*`)
2. **Seller dashboard** (`/seller/*`)
3. **Admin dashboard** (`/admin/*`)

For mobile app cohesion, buyer and seller are the primary focus; admin can remain web-first unless explicitly in app scope.

---

## 2) Where user is taken to dashboard in current UI

## 2.1 Login redirect logic

From login page:

- If role is seller -> redirect to `/seller/dashboard`
- Otherwise -> redirect to `/dashboard`

Sources:

- `src/app/(auth)/login/page.tsx`
- `src/contexts/AuthContext.tsx`

## 2.2 Header dashboard CTA

Global header dashboard button routes by role:

- admin -> `/admin/dashboard`
- seller -> `/seller/dashboard`
- buyer/default -> `/dashboard`

Source:

- `src/components/layout/AppHeader.tsx`

## 2.3 Protected route fallback routing

If user opens wrong role area:

- seller gets bounced to `/seller/dashboard`
- non-seller gets bounced to `/dashboard`

Source:

- `src/components/ProtectedRoute.tsx`

## 2.4 Seller center landing

`/seller` page includes a direct card linking to `/seller/dashboard`.

Source:

- `src/app/seller/page.tsx`

---

## 3) Dashboard IA for mobile (recommended)

## 3.1 Buyer app IA

Bottom tabs:

1. Home (Dashboard Summary)
2. Marketplace
3. Orders
4. Wallet
5. Account

Inside Account stack:

- Profile
- Addresses
- Referrals
- Settings
- Wishlist
- Notifications center

## 3.2 Seller app IA

Bottom tabs:

1. Overview
2. Orders
3. Products
4. Analytics
5. Account

Inside Account stack:

- Shop Setup / Edit
- Verification
- Logistics
- Categories
- Wallet / Purchases / Settings
- Notifications center

---

## 4) Endpoint map by dashboard module

## 4.1 Buyer dashboard

### Overview screen

- `GET /api/orders?role=buyer&limit=5` (recent orders)
- `GET /api/orders?role=buyer&limit=100` (aggregate stats on client today)
- `GET /api/products/featured?limit=6` (recommended strip; fallback to products list)
- fallback: `GET /api/products?page=1&limit=6`

### Orders

- `GET /api/orders?role=buyer&...`
- `GET /api/orders/:id`
- `POST /api/orders/:id/confirm-delivery`
- `POST /api/payments/payout` (when release action is exposed)

### Wallet

- `GET /api/wallet/balance`
- `GET /api/wallet/transactions?limit=25`
- `POST /api/wallet/fund`

### Profile / account

- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/addresses`
- `POST /api/users/avatar`
- `DELETE /api/users/avatar`
- `GET /api/users/export`

### Referrals

- `GET /api/referrals/me`
- `GET /api/referrals/referred-users`
- `POST /api/referrals/apply`

## 4.2 Seller dashboard

### Overview

- `GET /api/seller/dashboard`
- `GET /api/shops/my` (shop identity/share + setup state)

### Orders

- `GET /api/orders?role=seller&limit=100`
- `PATCH /api/orders/:id/status`
- `GET /api/orders/:id`

### Products

- `GET /api/seller/products?...`
- `POST /api/products`
- `PUT /api/products/:productId`
- `DELETE /api/products/:productId`

### Analytics

- `GET /api/seller/analytics?period=...`
- (Optional shop-level analytics where needed): `GET /api/shops/:shopId/analytics?period=...`

### Setup / categories / logistics / verification

- `GET /api/shops/my`
- `POST /api/shops`
- `PUT /api/shops/:shopId`
- `GET /api/seller/categories`
- `POST /api/seller/categories`
- `POST /api/verify/identity`
- `POST /api/users/kyc/submit`

---

## 5) Mobile UI parity notes (dashboard visuals)

## 5.1 Buyer dashboard visual system

- Hero greeting with 3 KPI cards: total spend, total orders, in-transit/pending.
- Quick action cards: marketplace, categories, wallet.
- Recent orders section:
  - segmented/list toggle
  - card click -> order detail
- Recommended products strip/grid.

## 5.2 Seller dashboard visual system

- Verification gate banner (restrictive states for unverified sellers).
- Core KPI row: revenue, orders, products, views.
- Recent orders stream with statuses + deep links.
- Top products list.
- Tactical action grid: new product, products, logistics, analytics.

## 5.3 Navigation + shell parity

- Keep role-specific shell:
  - buyer shell equivalent of `/dashboard/layout.tsx`
  - seller shell equivalent of `/seller/layout.tsx`
- Include notification bell + unread badge in top app bar.
- Keep contextual CTAs (e.g., seller verification/setup prompts).

---

## 6) Notification capability answer (push vs updates)

## 6.1 Do users get native push notifications today?

**No native mobile push (FCM/APNs) is implemented in this code path.**

What exists:

- In-app notification records in DB.
- SSE stream updates (`/api/notifications/stream`).
- Socket event support (`new_notification`) when socket is connected.
- Polling fallback in client hook.

So users get **in-app real-time-ish updates**, not true OS push notifications.

## 6.2 Do users get notification updates for all critical events?

**Not fully. Coverage is partial.**

Examples of covered flows:

- New order -> seller + admins.
- Payment verify/webhook -> buyer/seller/admin updates.
- Delivery webhook updates -> order/delivery notifications.
- Dispute/confirm flows -> order/payment notifications.
- Shop view / product like alerts for sellers.
- Support ticket notifications for admins.

Known gaps:

1. `PATCH /api/orders/:id/status` currently updates order status but does not emit buyer notification directly.
2. `notifyNewMessage()` exists but is not wired from chat send path; chat notifications rely on chat/socket features, not persisted notification records.
3. No FCM/APNs backend pipeline for device push.
4. Some header unread-count logic still uses `status=unread` query while notifications API expects `unread=true`.

---

## 7) IG metric (Impact Gap) for notifications

IG definition used here:

- **IG = 1 - (weighted critical-event coverage)**
- Lower is better.

Engineering estimate from current code paths:

- Weighted coverage: ~68%
- **IG ~ 0.32** (moderate gap)

Interpretation:

- Core commerce events are mostly covered.
- Messaging + uniform status-update notifications + native push are the major missing pieces.

---

## 8) Recommended implementation order (mobile cohesion + notification reliability)

1. **Dashboard shell parity**
   - Build buyer and seller app shells with role-based nav and deep links matching web routes.
2. **Endpoint parity**
   - Consume the exact endpoint groups listed in section 4.
3. **Notification center parity**
   - Implement `/api/notifications` list/read/delete/mark-all and in-app bell badge.
4. **Real-time strategy**
   - Start with polling + optional socket updates.
   - Treat SSE as optional transport depending on mobile stack.
5. **Close highest-impact gaps**
   - Add notification emit in `/api/orders/:id/status` for buyer/seller counterpart.
   - Wire chat message -> persisted notification where required.
6. **Native push phase**
   - Add device token registration + FCM/APNs dispatch only after in-app parity is stable.

---

## 9) Final decision guidance

If the question is “is current dashboard + notifications enough for mobile release?”:

- **Dashboard API/UI parity:** yes, largely ready.
- **Notification completeness for production-quality engagement:** not yet complete without gap fixes above.

Best path:

- Launch with in-app notifications + polling/socket parity,
- then ship push + remaining coverage gaps in the next sprint.
