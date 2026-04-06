# Product Detail Page — Endpoint Consumption

This document explains how the web Product Detail Page (`/product/[slug]`) consumes backend endpoints, transforms responses, and uses them in UI sections.

Primary source file: `src/app/product/[slug]/page.tsx`

---

## 1) Runtime data flow (high level)

On page load:

1. Read `slug` from route params.
2. Fetch product data via `productsApi.getBySlug(slug)`.
3. Normalize response into the page’s internal `product` shape.
4. Render:
   - gallery + metadata + purchase actions
   - shop summary
   - reviews block
   - AI recommendations block

When user interacts:

- Add to cart -> update local cart store, then attempt server sync.
- Reviews component fetches reviews and checks review eligibility.
- AI recommendations component fetches suggested products.

---

## 2) Endpoints used by Product Detail Page

## A) Product details

- **Client helper call:** `productsApi.getBySlug(slug)`
- **Helper route in code:** `api("/api/products/${slug}")` (`src/lib/api.ts`)
- **Server route handling:** `src/app/api/products/[productId]/route.ts`
  - If segment is ObjectId => fetch by id
  - Else => fetch by slug fallback

### Response handling in page

`ProductDetailPage` accepts multiple shapes and normalizes:

- `response.data.product`
- `response.data`
- `response.product`
- `response`

Then maps into internal fields like:

- `id`, `slug`, `title`, `description`, `longDescription`
- `price`, `maxPrice`, `compareAtPrice`
- `stock`, `moq`
- `images`, `condition`, `category`
- `variants`
- `shop` object (`shopName`, `shopSlug`, `shopId`, `logo`, `socialLinks`, etc.)

This normalization is why the page remains resilient to minor response envelope differences.

---

## B) Cart sync on add-to-cart

After local add, page attempts server sync:

- **Call:** `cartApi.addToCart(product.id, quantity)`
- **Route:** `POST /api/cart`

Behavior:

- Local cart update always happens first (fast UI).
- Server sync failure is logged but does not block local success.

---

## C) Reviews block

Rendered via `ProductReviews` component (`src/components/product/ProductReviews.tsx`).

### 1. Fetch review list/stats

- **Call:** `GET /api/reviews?productId=<id>`
- Used to populate:
  - `reviews[]`
  - `stats` (`averageRating`, `totalCount`, `distribution`)

### 2. Check if current user can review

- **Call:** `GET /api/orders?role=buyer&status=delivered`
- Logic:
  - user must have delivered order containing this product
  - user must not have already reviewed

### 3. Submit review

- **Call:** `POST /api/reviews`
- Payload:
  - `orderId`
  - `productId`
  - `shopId`
  - `rating`, `title`, `comment`

---

## D) AI recommendations block

Rendered via `AIRecommendations` component (`src/components/product/AIRecommendations.tsx`).

- **Call:** `GET /api/ai/recommendations?type=similar&productId=<id>&limit=4` (default)
- Expected consumption:
  - `response.data.recommendations[]`
  - each recommendation includes `product` with `slug`, `title`, `price`, `images`, optional `shop`

---

## E) Shop page navigation from PDP

No extra fetch from PDP itself; it links out:

- `href="/shop/${product.shop.shopSlug}"`

The destination shop page then fetches its own data via:

- `GET /api/shops/slug/[slug]` (through `shopsApi.getBySlug`)

---

## 3) Variant/options behavior on PDP

PDP keeps a selected variant id:

- `selectedVariantId` defaults to `"standard"`

When adding to cart:

1. Find selected variant by id/name.
2. Compute price with `getEffectivePrice(basePrice, variant.price)`.
3. Use variant image if present, else base product images.
4. Compute stock from `variant.stock ?? product.stock`.
5. Save variant metadata into cart item (`variantId`, `variantName`).

This ensures correct price/media/stock for option-specific checkout.

---

## 4) Endpoint sequence example (typical visit)

1. `GET /api/products/<slug-or-id>`  
2. `GET /api/reviews?productId=<productId>`  
3. `GET /api/orders?role=buyer&status=delivered` (if authenticated, eligibility check)  
4. `GET /api/ai/recommendations?type=similar&productId=<productId>&limit=4`  

On user actions:

- Add cart: `POST /api/cart`
- Post review: `POST /api/reviews`

---

## 5) Notes for mobile parity

- Keep flexible response parsing for product detail payloads (as web does).
- Do local cart update first; treat cart API sync as best-effort.
- Variants must override base price/stock/image only when provided.
- Reviews UX depends on delivered-order check endpoint.
- Recommendations endpoint is optional; safely hide module when empty/error.

