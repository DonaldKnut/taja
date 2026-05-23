# React Native Product Card + Options Blueprint

This document explains how product endpoints are fetched today, how product options/variants behave on web, and how to mirror that behavior in React Native product cards.

---

## 1) Primary endpoint for marketplace product cards

Use:

- `GET /api/marketplace/feed`

This is the same endpoint the web marketplace uses (`useMarketplaceFeed`) and it already returns product objects shaped for card rendering.

### Query params

- `category` (name or slug)
- `search`
- `shop`
- `seller`
- `minPrice`, `maxPrice`
- `verifiedOnly=true|false`
- `limit` (default `50`, max `100`)
- `includeMine=true` (for authenticated seller context)

### Response

```json
{
  "success": true,
  "data": {
    "products": [...],
    "recommendedShops": [...],
    "categories": [...]
  }
}
```

---

## 2) Product fields RN card should consume

From each `data.products[]` item:

- Identity: `_id`, `id`, `slug`, `title`
- Media: `images[]`
- Pricing: `price`, `maxPrice`, `compareAtPrice`
- Options: `variants[]`
- Stock:
  - base stock: `inventory?.quantity ?? stock ?? 0`
  - base MOQ: `inventory?.moq ?? moq ?? 1`
- Seller/shop:
  - `seller._id`, `seller.fullName`, `seller.avatar`
  - `shop._id`, `shop.shopName`, `shop.shopSlug`, `shop.logo`, `shop.isVerified`
- Social proof: `likes`, `averageRating`, `reviewCount`

---

## 3) Options button behavior (web parity)

Current web behavior:

- If `variants?.length > 0`:
  - show **Options** button
  - click opens options chooser
- If no variants:
  - show single quick add

In React Native, implement options chooser as a bottom sheet/modal.

### Options list order

1. **Standard** base option
   - Label: `Standard`
   - Price: base `product.price`
   - Stock: `inventory.quantity ?? stock ?? 0`
   - Disabled when stock <= 0

2. **Variant options** (`product.variants`)
   - Label: `variant.name`
   - Thumbnail: `variant.image || product.images[0]`
   - Price: `variant.price ?? product.price`
   - Stock: `variant.stock ?? inventory.quantity ?? stock ?? 0`
   - Disabled when stock <= 0

---

## 4) Card price display logic (range)

Use same logic as web:

- Base price is always included.
- For each active variant, effective price = `variant.price ?? basePrice`.
- Compute:
  - `minPrice = min(basePrice, ...variantEffectivePrices)`
  - `maxPrice = max(basePrice, ...variantEffectivePrices)`
- Display:
  - If has variants and `maxPrice > minPrice`: `From ₦minPrice - ₦maxPrice`
  - Else: single formatted base price

---

## 5) Add-to-cart payload blueprint

When user picks base or variant option:

```ts
{
  _id: product._id,
  title: product.title,
  price: selectedVariant?.price ?? product.price,
  images: selectedVariant?.image
    ? [selectedVariant.image, ...(product.images || [])]
    : product.images,
  quantity: 1,
  seller: typeof product.seller === "string" ? product.seller : product.seller?._id,
  shopSlug: product.shop?.shopSlug || product.shopSlug,
  moq: product.inventory?.moq ?? product.moq ?? 1,
  stock: selectedVariant?.stock ?? product.inventory?.quantity ?? product.stock ?? 999,
  variantId: selectedVariant?._id,      // optional
  variantName: selectedVariant?.name    // optional
}
```

---

## 6) Product detail fetch for RN

For PDP / detail screen:

- Preferred explicit slug route: `GET /api/products/slug/[slug]`
- Alternative: `GET /api/products/[productId]` (supports ObjectId; route also handles slug fallback logic)

---

## 7) RN flow blueprint

1. Fetch feed from `/api/marketplace/feed` with active filters.
2. Render product cards in list/grid.
3. Per card:
   - Determine `hasVariants = (variants?.length ?? 0) > 0`
   - Compute price label/range
   - Show `Options` button if `hasVariants`, else quick-add
4. On `Options` click:
   - Open bottom sheet with Standard + variants
5. On option select:
   - Validate stock > 0
   - Build cart payload (section 5)
   - Add to cart and close sheet
6. Card click -> product detail by `slug`

---

## 8) Important edge cases

- `category` may be string or object depending on endpoint shaping; guard for both.
- Variants may omit `price` and/or `stock`; always fallback to base product values.
- For authenticated API calls, send `Authorization: Bearer <token>`.
- If seller should see own non-active items in feed, include `includeMine=true`.

---

## 9) Minimal TypeScript model (RN)

```ts
type ProductVariant = {
  _id?: string;
  name: string;
  price?: number;
  stock?: number;
  image?: string;
  active?: boolean;
};

type MarketplaceProduct = {
  _id: string;
  id?: string;
  slug: string;
  title: string;
  price: number;
  maxPrice?: number;
  compareAtPrice?: number;
  images: string[];
  category?: string | { name?: string };
  inventory?: { quantity?: number; moq?: number };
  stock?: number;
  moq?: number;
  variants?: ProductVariant[];
  seller?: string | { _id?: string; fullName?: string; avatar?: string };
  shop?: { _id?: string; shopName?: string; shopSlug?: string; logo?: string; isVerified?: boolean };
  shopSlug?: string;
  likes?: number;
  averageRating?: number;
  reviewCount?: number;
};
```

