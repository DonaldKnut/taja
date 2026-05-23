# Mobile Add Product: UI flow and API contract

This document mirrors the current web **Add Product** experience (`src/app/seller/products/new/page.tsx`) so React Native (or any mobile client) can implement the same flow against the same endpoints.

**Auth:** Every call below (except optional public reads) expects `Authorization: Bearer <access_token>` unless noted.

---

## 1) Preconditions (same as web)

Before showing the add-product screen, mobile should enforce:

1. **User has a shop** — `GET /api/shops/my` returns a shop document (not `null`).
   - If no shop → redirect to shop setup (web uses `/seller/setup`).
2. **Seller verification** — web treats `user.kyc.status === "approved"` as required to add products.
   - If not approved → redirect to KYC (web uses `/onboarding/kyc`).

These checks are **client-side** on web; the API still validates shop ownership on create.

---

## 2) Endpoint reference

### `GET /api/shops/my`

**Purpose:** Confirm the seller has registered a shop and optionally read `shopName` / `_id` for UI.

**Response:** `{ success: true, data: <shop> | null }` (shop includes normalized `categories` / `categoryIds` when present).

---

### `GET /api/seller/categories`

**Purpose:** Populate the category picker (searchable list, hierarchical display if you use `parent` / `subcategories` from each document).

**Auth:** `seller` or `admin`.

**Response:** `{ success: true, data: Category[] }` — each item includes at least `_id`, `name`, `slug`, plus optional `parent`, `subcategories` (populated).

**Mobile recommendation:**

- Prefer sending **`category` as the selected category’s `_id`** on create (clearest, avoids name collisions).
- Sending **category name** or **slug string** also works: `POST /api/products` resolves non-ObjectId values by name (case-insensitive) or slug; if nothing matches, API returns **400** `Category '…' not found`.

---

### `POST /api/upload`

**Purpose:** Upload each product image; returns a **URL string** to store in the `images` array.

**Method:** `multipart/form-data`

**Fields:**

- `file` — image binary
- `type` — `"product"`

**Response (typical):** `{ success: true, data: { url: "https://..." } }` (web reads `data.url` or `data`).

**Limits / UX (web parity):**

- Web allows **up to 8** images total; first image in the array is the **main** image.
- Variant-specific images on web are still uploaded the same way; the URL may be stored on the variant and/or merged into the main `images` list (same 8-image cap).

---

### `POST /api/products`

**Purpose:** Create the product (publish or draft).

**Auth:** `seller` or `admin`.

**Server-side rules (important):**

- **Required by API:** `title`, `description`, `category`, `price`, `images` (non-empty array).
- **Shop:** API **ignores** a client-provided `shop` for authorization; it always attaches the product to the shop owned by the authenticated user (`SHOP_REQUIRED` if none).
- **Category:** Must resolve to an existing `Category` document unless `category` is already a valid ObjectId.

**Optional / common body fields** (aligned with `src/app/api/products/route.ts` and web payload):

| Field | Role |
|--------|------|
| `title` | Product name |
| `description` | Short description (required by API) |
| `longDescription` | Optional extended copy |
| `category` | ObjectId string **or** name/slug resolvable to a category |
| `subcategory` | Optional string |
| `condition` | `new` \| `like-new` \| `good` \| `fair` \| `poor` (default `new`) |
| `price` | Number (≥ 0) |
| `maxPrice` | Optional (e.g. variable pricing) |
| `compareAtPrice` | Optional “was” price |
| `currency` | e.g. `NGN` (schema default `NGN`) |
| `images` | String URLs from `/api/upload` |
| `videos` | Optional array |
| `inventory` | `{ quantity, sku?, trackQuantity?, moq? }` |
| `shipping` | `{ weight, dimensions?, freeShipping, shippingCost, costPerKg?, weightTiers?, processingTime }` |
| `specifications` | Flat object (brand, size, color, etc.) |
| `seo` | `{ tags[], metaTitle?, metaDescription? }` |
| `status` | `draft` or `active` (web: “Save draft” → `draft`; publish uses form status, usually `active`) |
| `variants` | Array of variant objects (see model) |

**Variants** (from `Product` schema): each variant can include `name`, `sku`, `price`, `compareAtPrice`, `stock`, `weight`, `image`, `options`, `active`. Web maps string fields to numbers before send.

**Success:** `201` with `{ success: true, data: product }`.

**Typical errors:** `400` missing fields / unknown category, `403` no shop, `401` not authenticated.

---

### `POST /api/ai/generate-description` (optional)

**Purpose:** AI-assisted description from title + optional existing description + category.

**Body:** `{ title, description?, category? }`

**Response:** `{ success: true, description: string }`

**Failure:** `503` if Gemini not configured (`GEMINI_API_KEY`).

---

### `POST /api/ai/suggest-tags` (optional)

**Purpose:** AI-suggested SEO tags.

**Body:** `{ title, description?, category?, count?: number }` (default count 10 on server)

**Response:** `{ success: true, tags: string[] }`

**Failure:** `503` if Gemini not configured.

---

## 3) Web payload shape (for parity)

The web builds an object equivalent to (simplified):

```json
{
  "title": "string",
  "description": "string",
  "category": "ObjectId or resolvable name/slug",
  "subcategory": "optional",
  "condition": "good",
  "price": 19999,
  "compareAtPrice": 24999,
  "currency": "NGN",
  "images": ["https://..."],
  "specifications": { },
  "inventory": {
    "quantity": 10,
    "sku": "optional",
    "trackQuantity": true,
    "moq": 1
  },
  "shipping": {
    "weight": 0.5,
    "freeShipping": false,
    "shippingCost": 0,
    "costPerKg": null,
    "processingTime": "1-2-days"
  },
  "seo": {
    "tags": [],
    "metaTitle": "",
    "metaDescription": ""
  },
  "status": "active",
  "variants": []
}
```

Note: Web also sends `name` and `shop` in the object; **`POST /api/products` uses `title` and server-assigned shop** — mobile can omit `name`/`shop` or send them; behavior is unchanged.

---

## 4) Mobile UI flow (recommended)

### 4.1 Screen structure

Use a **wizard** or **one long scroll** with sticky primary actions; match web sections mentally:

1. **Gate / loading** — Call `GET /api/shops/my` + read KYC from `GET /api/users/me` (or your auth user object). Block or redirect if invalid.
2. **Basics** — Title, description, category picker, subcategory, condition.
3. **Media** — Multi-image picker → upload each via `POST /api/upload` → show reorder + “set as main” (index 0).
4. **Pricing** — Price, compare-at, currency.
5. **Inventory** — Quantity, SKU, track quantity, MOQ.
6. **Shipping** — Weight, free shipping toggle, shipping cost, cost per kg (if used), processing time preset.
7. **Specifications** — Dynamic fields: web uses category-name hints (e.g. Fashion → size/color); mobile can use the same map or a simplified generic spec form.
8. **Variants** (optional) — Add rows: name, price, stock, weight, optional image (upload → URL).
9. **SEO** — Tags (chips), meta title/description.
10. **Actions** — **Save draft** (`status: "draft"`) and **Publish** (`status: "active"`).

**Validation (align with API, stricter than web Zod):**

- Require non-empty **description** and **category** before submit (API requires them even if web Zod marks category optional).
- Require **≥ 1 image** URL.
- Clamp images to **8**.

### 4.2 AI affordances (optional)

- **Improve description** — enabled when title non-empty; calls `generate-description`.
- **Suggest tags** — enabled when title non-empty; merge tags into `seo.tags` (web caps merged list at 15).

### 4.3 After success

- Navigate to product list / product detail (web: `router.push("/seller/products")`).

---

## 5) Client helper mapping (`src/lib/api.ts`)

- **Create product:** `sellerApi.createProduct(data)` → `POST /api/products`
- **Upload:** `uploadProductImage(file)` → `POST /api/upload` with `type=product`
- **Categories:** `GET /api/seller/categories` (call via `api()` wrapper)

---

## 6) Pitfalls for mobile

1. **Category must exist** — New arbitrary category strings will **fail** unless you first create a category (e.g. `POST /api/seller/categories`) or select an existing one.
2. **Description required** — Empty description will **400** on API even if UI allows skipping.
3. **Shop is server-bound** — No need to fetch shop ID for create; still fetch `GET /api/shops/my` for gating and UX.
4. **AI endpoints** — Handle `503` / missing key gracefully (disable buttons or show “AI unavailable”).

---

## 7) Source files (web reference)

- UI: `src/app/seller/products/new/page.tsx`
- Create API: `src/app/api/products/route.ts` (`POST`)
- Upload: `src/app/api/upload` (used via `uploadProductImage`)
- Categories: `src/app/api/seller/categories/route.ts` (`GET`)
- AI: `src/app/api/ai/generate-description/route.ts`, `src/app/api/ai/suggest-tags/route.ts`
- Model: `src/models/Product.ts`
