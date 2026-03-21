# Taja Shop — Backend business logic (NestJS handoff)

This document describes **what the marketplace does** so a **NestJS** (or any) backend can re-implement the same rules. The current app uses **Next.js Route Handlers** under `/api/*` and **MongoDB/Mongoose**. OpenAPI surface: **`/api/openapi`**, interactive docs: **`/docs/api`**.

---

## 1. Product summary

**Taja** is a **multi-vendor marketplace** (Nigeria-focused: Naira, local delivery partners). Users are **buyers**, **sellers**, or **admins**. Sellers run **shops** and list **products**. Buyers browse, cart, pay via **Paystack / Flutterwave**, and receive orders with **seller-managed shipping** and optional **third-party delivery** (e.g. Kwik, Gokada). **Escrow-style** flows hold funds until the buyer confirms delivery or an auto-confirm window passes. **KYC** gates serious seller operations. **Admin** approves shops, reviews KYC, resolves disputes, and configures platform settings.

---

## 2. Authentication & sessions

- **Email/password**: register, login, JWT issued; refresh tokens stored on `User` with device metadata.
- **OAuth**: Google; profile merge / account creation.
- **Password reset**: token + expiry on user; email flow.
- **Email verification**: codes + expiry.
- **Account lockout**: failed login attempts + `lockUntil`.
- **API auth**: `Authorization: Bearer <accessToken>` (and cookie `token` for browser). Nest should mirror JWT validation and role checks on every protected route.

**Roles**: `buyer` | `seller` | `admin`. Users select role after signup (`roleSelected`); sellers complete shop setup separately.

---

## 3. Users (domain)

| Concern | Rules |
|--------|--------|
| **Profile** | `fullName`, `email`, `phone`, `avatar`, `coverPhoto`, preferences (email/push/sms). |
| **Addresses** | Multiple addresses; one default; used at checkout. |
| **Account status** | `active` / `suspended` / `banned` / `under_review` — blocked users cannot transact. |
| **KYC** | See §6. |
| **Referrals** | `referralCode`, `referredBy`, stats; rewards on referred user actions (configurable). |
| **Points** | Reward points from purchases (e.g. per ₦100 spent), often granted on delivery completion. |

---

## 4. Shops

- **Owner**: seller user ID.
- **Identity**: `shopName`, unique `shopSlug`, description, about, tagline, category, address, logo/banner + `avatar`/`coverImage`, social links.
- **Settings**: response time, shipping methods, return policy, default delivery fee, pickup points, global delivery toggles, min order amount, weight-based delivery fee tiers, delivery slots (capacity).
- **Verification**: `pending` / `verified` / `rejected` with documents and admin reviewer.
- **Status**: `pending` | `active` | `suspended` | `banned`.
- **Stats**: product count, orders, revenue, rating, reviews, followers, views.

### Shop visibility (buyer-facing)

- **`GET /api/shops/slug/:slug`**: If `shop.status !== 'active'`, respond **404** for anonymous buyers.
- **Exception**: **Shop owner** or **admin** (valid Bearer) may still load the shop to finish setup or review.

### Admin shop lifecycle

- Pending shops listed; admin **approves** or **rejects** → transitions to `active` or remains pending/rejected per your workflow.
- Admin can update/delete shops, export lists.

---

## 5. Products

- Belongs to **seller** and **shop**; category + optional subcategory.
- **Pricing**: base `price`, optional `compareAtPrice`. **Listing price ranges** are not stored as a separate min–max on the product: they are computed from **base `price` + variant prices** (see below). Legacy `maxPrice` on older documents may be cleared on edit; sellers do not set a separate “max” field in the storefront.
- **Variants**: optional array (size/color, SKU, per-variant price/stock/weight/image). **If variants exist, checkout must bind a specific variant** (UI enforces selection before add-to-cart). Quick-add options on cards include a **“Standard”** row at the **base price** and stock so buyers can pick the default listing without a named variant row.

### Variant pricing (listings vs. selected variant)

- **Stored fields**: `Product.price` is always the **base** listing price. Each variant may set its own `price`; if omitted, the effective price for that variant is the base `price` (same rule for cart/orders: snapshot the resolved amount).
- **Buyer-facing listings** (product cards, grids, product detail **before** a variant is chosen): show a **range** — **minimum and maximum** over **base `price` plus every active variant’s effective price** (not only variant rows). Example: base ₦4,000 and one variant ₦5,000 → display **From ₦4,000 – ₦5,000** (or equivalent), not a single ₦5,000 that hides the base.
- **After the buyer selects a variant** (PDP, cart line, checkout): show the **effective price** for that variant: variant `price` when set, otherwise base `price`.
- **Products with no variants** (or no active variants): use a **single** displayed price — base `price` only (no product-level two-price range).

Reference implementation: `getProductDisplayPriceRange` and `getEffectivePrice` in `src/lib/productPricing.ts`.

- **Inventory**: quantity, SKU, `trackQuantity`, MOQ.
- **Shipping**: weight, dimensions, freeShipping flag, shippingCost, costPerKg, weight tiers, processing time.
- **Status**: `draft` | `active` | `out_of_stock` | `suspended` | `deleted`.
- **SEO**: tags, meta title/description.
- **Media**: images array; optional video entries.

**Nest**: enforce seller owns shop; only active shops should list products publicly (align with shop status).

---

## 6. KYC (sellers)

- **Statuses**: `not_started` | `pending` | `approved` | `rejected`.
- **Payload**: business name/type, registration number, tax ID, ID type/number, ID images, selfie, bank details, BVN, business address, utility bill, business license; optional phone verification for KYC; optional third-party identity verification payload.
- **User submits** → `pending`. **Admin reviews** → `approved` / `rejected` with reason.
- **Admin**: list KYC, pending queue, per-user decision, **bulk reminder** to users stuck in `not_started` (email).

---

## 7. Cart

- Guest and logged-in carts; **merge** on login.
- Line items: product, quantity, snapshot price/title/image, **variant index or variant key** when applicable.
- CRUD on lines; clear cart.

---

## 8. Orders

### Creation

- From cart: shipping address, payment method, coupon if any.
- Totals: subtotal, shipping, tax, discount, **total** (typically kobo/minor units or Naira — be consistent).

### Status machine (high level)

- `pending` → `confirmed` → `processing` → `shipped` → `delivered` → `completed` (and branches: `cancelled`, `refunded`, `disputed`).

### Payment

- `paymentStatus`: pending / paid / failed / refunded.
- Methods: Paystack, Flutterwave, bank transfer, COD, crypto (as configured).

### Escrow & payout

- **Escrow**: hold buyer funds; **release** to seller after buyer confirms receipt or **auto-confirm** after a deadline from “delivered” (cron).
- Track platform fee, seller net amount, hold reference, release/refund timestamps.
- **Payout**: seller withdrawal to bank; statuses pending → processing → completed/failed.

### Delivery (seller)

- Seller sets **tracking** (carrier, tracking number, URL, label URL), shipped/delivered timestamps, buyer confirmation fields, auto-confirm date.

### Buyer confirmation

- `buyerConfirmation`: pending → confirmed | auto_confirmed | disputed.
- Confirmed → triggers escrow release and points/referral rewards as implemented.

### Disputes

- Buyer opens dispute with reason + evidence.
- **Admin** resolves: `open` → `under_review` → `resolved_buyer` | `resolved_seller` | `resolved_split` with refund amount / notes.

---

## 9. Payments (integrations)

- **Initialize**: create payment session (amount, email, metadata with order id).
- **Webhooks**: Paystack & Flutterwave — verify signature, idempotent update of order payment status and escrow funding.
- **Verify**: client/server callback verification after redirect.
- **Platform settings**: admin-configurable keys/fees (store encrypted or in secrets in Nest).

---

## 10. Wallet

- User wallet balance; **fund** via payment gateway; **verify** top-up; **transactions** list (ledger).

---

## 11. Delivery providers

- **Quote / book** delivery (Kwik, Gokada, etc.) — order-linked.
- **Webhooks** from carriers update tracking state.
- **Public tracking** by tracking number or order id where exposed.

---

## 12. Reviews

- Post-purchase reviews tied to product/order; aggregate updates on product and shop stats.

---

## 13. Wishlist & follows

- Wishlist: per-user product list.
- **Shop follow**: follower count on shop.

---

## 14. Notifications

- In-app notifications; mark read / delete / mark all read; optional **SSE stream** for live updates.
- Admin **broadcast** to segments.

---

## 15. Chat

- Buyer–seller threads (product/shop context); messages, read receipts, delete thread.

---

## 16. Support tickets

- User-created tickets: category, priority, status, messages (user/admin/seller/system), attachments, optional links to order/product/shop.
- **seenBy** for admin inbox (avoid version races on concurrent updates — use atomic array pushes).
- Staff replies; internal notes; resolution workflow.

---

## 17. Search & discovery

- **Algolia** (or similar) sync from admin; marketplace **feed**; search + suggestions.
- **Featured** products API.

---

## 18. Blog & CMS-lite (Journal)

- **Public app**: `/blog` — magazine-style index (featured hero, category chips, grid) and `/blog/[slug]` for articles. Server-side data via `src/lib/blog-queries.ts` (revalidate ~120s).
- **Models**: `BlogPost` (optional `isFeatured` for hero), `BlogCategory`; slug-based read; **admin** CRUD via `POST/PUT/DELETE` `/api/blog/posts` and categories API.
- **Views**: `recordPostView` on article page (metadata uses read-only fetch so views are not double-counted).

---

## 19. AI-assisted seller tools

- Image analysis, descriptions, tags, shop policies, inventory hints, recommendations, virtual try-on, style recommendations, shopping assistant chat.
- **Nest**: isolate behind service modules; same API contracts as `/api/ai/*` and `/api/assistant/*` if frontend stays unchanged.

---

## 20. Admin capabilities (checklist)

| Area | Actions |
|------|---------|
| **Dashboard** | Stats, orders overview. |
| **Users** | List, edit, export. |
| **Shops** | List, create, edit, delete, pending queue, approve/reject, export. |
| **Products** | List, create, edit, stats. |
| **Orders** | List, export. |
| **KYC** | List, pending, approve/reject, reminders. |
| **Disputes** | List, detail, resolve. |
| **Payments** | Platform payment settings. |
| **Referrals** | Referral program settings. |
| **Search** | Reindex / sync. |
| **Notifications** | Broadcast. |
| **Subscribers** | Marketing list. |
| **Sellers** | Earnings views. |
| **Cleanup / seed** | Dev/staging only; protect in production. |

---

## 21. Cron / scheduled jobs

- **Auto-confirm orders**: move delivered orders past deadline to `auto_confirmed` and release escrow.

---

## 22. Entity reference (Mongoose collections → Nest entities)

Map 1:1 for parity: **User**, **Shop**, **Product**, **Category**, **Order**, **Cart**, **Review**, **Wishlist**, **ShopFollow**, **Notification**, **Chat**, **SupportTicket**, **WalletTransaction**, **Banner**, **BlogPost**, **BlogCategory**, **Page**, **PlatformSettings**, **SearchAnalytics**, etc.

---

## 23. Suggested NestJS module layout

```
auth/          # JWT, OAuth, password, verification
users/         # profile, addresses, KYC submit
shops/         # CRUD, slug, follow, analytics
products/      # CRUD, slug, featured, seller catalog
cart/
orders/        # lifecycle, tracking, confirm, dispute
payments/      # initialize, verify, webhooks
wallet/
delivery/      # quotes, webhooks, tracking
admin/*        # guards Roles('admin')
support/       # tickets, messages, seen
notifications/
chat/
search/
blog/
ai/            # proxies to LLM/vision services
cron/          # auto-confirm (Bull/scheduler)
```

---

## 24. API index

- **Machine-readable**: `GET /api/openapi` (OpenAPI 3).
- **Human browse**: `/docs/api`.
- **Regenerate path list**: `node scripts/generate-openapi.js`.

When porting to Nest, keep **URL paths** and **status codes** compatible unless you version the API (e.g. `/v1/...`).

---

*Generated for backend parity with the Taja Shop Next.js application.*
