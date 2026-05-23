# Marketplace, products, categories & shops — API and UI

This document describes how the **marketplace feed**, **product listing/detail APIs**, **categories**, **shops (sellers)**, and the **`ProductCard`** UI fit together. Paths are relative to your app origin (e.g. `https://tajaapp.shop`).

**Response shape (common):** Most routes return JSON like `{ success: boolean, message?: string, data?: ... }`.

---

## 1. Marketplace feed (primary discovery)

### `GET /api/marketplace/feed`

Single endpoint used by the in-app marketplace to load **products**, **category names for filters**, and **recommended shops**. Implemented in `src/app/api/marketplace/feed/route.ts`.

**Query parameters**

| Param | Description |
|--------|-------------|
| `category` | Category **name** or **slug** (server resolves to a `Category` document and filters by `category` ObjectId). If no match, products are not filtered by category. |
| `search` | Case-insensitive match on title, description, longDescription, subcategory, tags; also matches **shop** name/slug and **seller** `fullName`. |
| `shop` | Filter by shop name or slug (regex). If no shop matches, returns **empty** `products`. |
| `seller` | Filter by seller `fullName` (regex). If no user matches, returns **empty** `products`. |
| `minPrice`, `maxPrice` | Numeric filters on product `price`. |
| `verifiedOnly` | `true` → only products whose shop has `verification.status === 'verified'`. |
| `limit` | Max products (default `50`, cap `100`). |
| `includeMine` | `true` → if the request is **authenticated** as a seller, includes that seller’s non-deleted products even when not `active`, merged with active catalog (see route logic). |

**Note:** The hook also sends `userId` in the query string for logged-in users; the feed route **does not** use `userId` in its filter logic today—it relies on `includeMine` + `authenticate()`.

**Success response (`data`)**

- **`products`** — Array of **normalized** product objects (not raw Mongoose docs). Important fields:
  - Identifiers: `_id`, `id`, `slug`, `title`
  - Pricing: `price`, `maxPrice`, `compareAtPrice`
  - Media: `images[]`
  - Category: `category` as a **string name** (e.g. `"Fashion"`), not always a populated object
  - **`variants`** — Passed through from DB (see [§5 Product variants](#5-product-variants-options))
  - `inventory` / `stock` / `moq` — Normalized for display
  - `seller`: `{ _id, fullName, avatar }` when populated
  - `shop`: `{ _id, shopName, shopSlug, logo, banner, isVerified, averageRating }` when populated
  - `averageRating`, `reviewCount`, `likes`, `createdAt`, etc.
- **`recommendedShops`** — Up to 6 active shops, sorted by followers and rating.
- **`categories`** — Array of **category name strings** (from active categories), for filter chips—not the full category documents.
- **`savedFilters`**, **`personalizedHeadline`**, **`experimentVariant`** — Placeholders (`control`, etc.) for future use.

### Frontend: how the marketplace fetches this

- Hook: `src/hooks/useMarketplaceFeed.ts` → calls `GET /api/marketplace/feed?...` via `api()` from `src/lib/api.ts`.
- UI: `src/components/marketplace/IntegratedMarketplace.tsx` uses `useMarketplaceFeed({ category, search, shop, seller, minPrice, maxPrice, verifiedOnly })` and maps results to **`ProductCard`**.
- Pages: `/marketplace` and `/dashboard/marketplace` render `IntegratedMarketplace` (dashboard passes `isInsideDashboard={true}`).

---

## 2. Product listing and detail APIs

### `GET /api/products`

Paginated **active** products (and optional seller “mine” merge). See `src/app/api/products/route.ts`.

| Query param | Description |
|-------------|-------------|
| `page`, `limit` | Pagination (default `page=1`, `limit=20`). |
| `search` | MongoDB **`$text`** search (requires text index on Product). |
| `category` | Filter by **`category` ObjectId string** (not the same as marketplace feed’s name/slug resolution). |
| `shopId` | Filter by shop id. |
| `condition` | Product condition enum. |
| `minPrice`, `maxPrice` | Price range. |
| `sortBy`, `sortOrder` | Sort field and `asc` / `desc`. |
| `includeMine` | Same idea as marketplace: authenticated seller can include their non-deleted items. |

**Response:** `{ success, data: { products, pagination: { page, limit, total, pages } } }`  
Products are **lean Mongoose** documents with `seller`, `shop`, `category` populated (richer than feed transform).

### `GET /api/products/featured`

**Query:** `limit` (default 10).  
**Filter:** `status: 'active'` and `featured: true`.  
**Response:** `{ success, data: products[] }` (array of products).

### `GET /api/products/[productId]`

- If `productId` is a valid **ObjectId** → `findById` (no `status` filter—draft/inactive products can be returned if the id is known).
- Otherwise treats the segment as **slug** with `status: { $ne: 'deleted' }`.

Populates `seller`, `shop`, `category`. Increments `views`. May notify seller of view (throttled).  
**Response:** `{ success, data: product }`.

### `GET /api/products/slug/[slug]`

Same idea as slug lookup: **active** only, populates relations, increments views, optional view notification.  
**Response:** `{ success, data: product }`.

### `POST /api/products` (sellers)

Creates a product; requires auth with role **seller** or **admin**. Body includes `variants` (optional array), `inventory`, `images`, etc. Shop must exist for the user. Not expanded here—see `src/app/api/products/route.ts` POST handler.

---

## 3. Categories

### `GET /api/categories`

All **active** categories, sorted by `sortOrder`, then name.  
Populates `parent` and `subcategories` (name, slug).  
**Response:** `{ success, data: categories[] }`.

### `GET /api/categories/[categoryId]`

Single category by MongoDB id; populates `parent` and `subcategories`.  
**Response:** `{ success, data: category }`.

### `GET /api/categories/[categoryId]/subcategories`

Lists active child categories where `parent` equals `categoryId`.  
**Response:** `{ success, data: subcategories[] }`.

### `POST /api/categories`

Admin-only create (see route).

**Using categories on the marketplace UI:** The feed returns **names** only in `data.categories`. The **selected filter** sends `category=<name or slug>` back to `/api/marketplace/feed`, which resolves to an id server-side.

---

## 4. Shops (sellers) and shop products

### `GET /api/shops`

Lists **active** shops with pagination.

| Query | Description |
|-------|-------------|
| `page`, `limit` | Pagination. |
| `search` | Regex on `shopName`, `description`. |
| `category` | Shop category filter (shop document field). |
| `verified` | `true` / `false` → filter `verification.status`. |

Enriches each shop with **live** `stats.totalProducts` and `stats.followerCount`.  
**Response:** `{ success, data: { shops, pagination } }`.

### `GET /api/shops/slug/[slug]`

Public shop profile by `shopSlug` (lowercased). Non-active shops return 404 unless viewer is **owner** or **admin** (see `src/app/api/shops/slug/[slug]/route.ts`). Increments view stats; may notify owner.

### `GET /api/shops/[shopId]/products`

Products for one shop.

| Query | Description |
|-------|-------------|
| `page`, `limit` | Pagination. |
| `status` | Defaults to `active`; can be overridden for owner/admin workflows. |

**Response:** `{ success, data: { products, pagination } }`.

### `POST /api/shops`

Authenticated user creates a shop (one per user); promotes buyer → seller when applicable. See `src/app/api/shops/route.ts`.

---

## 5. Product variants (“options”)

Defined on the **Product** model (`src/models/Product.ts`). Each variant can include:

| Field | Purpose |
|-------|---------|
| `name` | Display label (e.g. “Size M — Red”). |
| `price` | Optional override; if omitted, base `product.price` is used. |
| `stock` | Optional override; if omitted, falls back to `inventory.quantity` in UI logic. |
| `image` | Optional thumbnail for that option. |
| `sku`, `compareAtPrice`, `weight`, `options` (map), `active` | Optional metadata; `active: false` excludes variant from price **range** calculation in UI helpers. |

---

## 6. How `ProductCard` displays products and options

Component: `src/components/product/ProductCard.tsx`. It expects a **`Product`** from `src/types` (aligned with API shapes).

**Layout (summary)**

1. **Image area** — `ImageSlider` over `product.images` (or a fallback image). Links to `/product/[slug]` unless `isInsideDashboard` (dashboard disables PDP link on the image).
2. **Wishlist** — Heart button; uses `product._id`, `slug`, `title`, `price`, shop info, `inventory.quantity` / `stock`.
3. **Title** — Linked to PDP when not dashboard mode.
4. **Category** — Shows populated `category.name` or string `category` or `"General"`.
5. **Likes** — From `product.likes` (local state updated on wishlist toggle).
6. **Seller row** (optional `showSellerRow`) — Avatar/name, message link, seller sheet with shop stats and links to chat + `/shop/[shopSlug]`.
7. **Price** — Uses `getProductDisplayPriceRange(product)` from `src/lib/productPricing.ts`:
   - Collects **base `price`** and each **active** variant’s effective price (`getEffectivePrice(base, variant.price)`).
   - If min ≠ max, passes **range** into `ProductPrice`, which shows e.g. `From ₦x - ₦y` when `hasVariants` is true.
8. **Options / quick add**
   - If **`product.variants` is non-empty** (`hasVariants`): shows an **“Options”** button. Click opens a **portal** panel (“Choose option”) with:
     - **Standard** row — base price, stock from `inventory.quantity` / `stock`; quick-add calls cart with base price.
     - One row per **variant** — thumbnail (`variant.image` or first product image), `variant.name`, stock, effective price; adds to cart with `variantId`, `variantName`, variant price/stock/image.
   - If **no variants**: single **+** button quick-adds base SKU (disabled when base stock ≤ 0).

**Cart line item fields** (quick add): `_id`, `title`, `price` (effective), `images`, `quantity`, `seller`, `shopSlug`, `moq`, `stock`, optional `variantId` / `variantName`.

---

## 7. Optional: Algolia search

`GET /api/search` — Product search when Algolia is configured (`src/app/api/search/route.ts`). Uses query params `q`, `category` (slug), `shop` (slug), price, sort, pagination, etc. If credentials are missing, the app may log that search is disabled.

---

## 8. Quick reference table

| Goal | Method & path |
|------|----------------|
| Marketplace grid + filters + recommended shops | `GET /api/marketplace/feed` |
| Paginated catalog (generic) | `GET /api/products` |
| Featured strip | `GET /api/products/featured` |
| PDP / product by id or slug | `GET /api/products/[productId]` |
| Product by slug only (active) | `GET /api/products/slug/[slug]` |
| All categories (tree-friendly) | `GET /api/categories` |
| One category | `GET /api/categories/[categoryId]` |
| Subcategories of a parent | `GET /api/categories/[categoryId]/subcategories` |
| Browse shops | `GET /api/shops` |
| Shop storefront metadata | `GET /api/shops/slug/[slug]` |
| Products in a shop | `GET /api/shops/[shopId]/products` |
| Full-text / filtered search (Algolia) | `GET /api/search` |

---

## 9. Mobile / external clients

Send `Authorization: Bearer <access_token>` on routes that require auth (e.g. `includeMine` only applies when the user is recognized). See `docs/MOBILE_API.md` for the broader mobile contract.
