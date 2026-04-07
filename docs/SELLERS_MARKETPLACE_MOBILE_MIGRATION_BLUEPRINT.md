# Sellers Marketplace Mobile Migration Blueprint

This document explains the full seller-focused marketplace experience on web and how to migrate it to mobile with feature parity.

It covers:

1. Seller marketplace UI architecture (as built on web)
2. Endpoints consumed
3. Seller search/filter behavior
4. Shop link copy/share flow
5. Website + follower count display
6. Recommended React Native implementation

---

## 1) What "sellers marketplace" means in current web app

There are 3 connected surfaces:

1. **Marketplace Feed Surface**
   - Route: `/seller/marketplace` (reuses `IntegratedMarketplace`)
   - Product-first discovery with seller/shop filters
2. **Seller Directory Surface**
   - Route: `/shops`
   - Shop-first discovery (cards of shops)
3. **Single Shop Surface**
   - Route: `/shop/[slug]`
   - Shop profile + product catalog + follow + social links + share

For mobile parity, treat these as one feature module with 3 screens.

---

## 2) Web architecture reference

## 2.1 Seller marketplace feed page

- `src/app/seller/marketplace/page.tsx` -> renders `IntegratedMarketplace`
- `src/components/marketplace/IntegratedMarketplace.tsx`
- Data hook: `src/hooks/useMarketplaceFeed.ts`

Behavior:
- Search bar supports products/shops/sellers
- Advanced filters:
  - category
  - shop name
  - seller name
  - min/max price
  - verified shops only
- Tabs:
  - `All`
  - `Promo`
  - `Best Deals`
- Featured shops strip at bottom

## 2.2 Seller directory page (`/shops`)

- `src/app/shops/page.tsx`
- Lists active shops from `/api/shops`
- Supports search by shop name/description
- Displays total products, rating, and basic shop metadata

## 2.3 Shop details page (`/shop/[slug]`)

- `src/app/shop/[slug]/page.tsx`
- Fetches shop details via `/api/shops/slug/:slug`
- Displays:
  - shop identity, verification, tenure
  - followers count
  - owner/seller card
  - social links (including website)
  - product grid/list
  - follow/unfollow
  - copy/share link (owner/admin view via `ShareShopButton`)

---

## 3) Endpoints consumed

## 3.1 Marketplace feed (product + seller filtering)

### `GET /api/marketplace/feed`

Query params:
- `category`
- `search` (global match across product/shop/seller)
- `shop` (shop filter)
- `seller` (seller filter)
- `minPrice`
- `maxPrice`
- `verifiedOnly=true|false`
- `limit`
- `includeMine` (optional, for seller mode)

Response:

```json
{
  "success": true,
  "data": {
    "products": [],
    "recommendedShops": [],
    "categories": [],
    "savedFilters": [],
    "personalizedHeadline": null,
    "experimentVariant": "control"
  }
}
```

Key notes:
- Search includes product fields and also shop/seller name matching.
- `recommendedShops` already includes `followerCount`, rating, verification.

---

## 3.2 Seller directory

### `GET /api/shops`

Query params:
- `page`
- `limit`
- `search`
- `category`
- `verified=true|false`

Response:

```json
{
  "success": true,
  "data": {
    "shops": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 200,
      "pages": 10
    }
  }
}
```

`shops[].stats` includes dynamic:
- `totalProducts`
- `followerCount`

---

## 3.3 Shop detail by slug

### `GET /api/shops/slug/:slug`

Response includes:
- shop profile data
- verification
- owner
- social links (instagram/whatsapp/twitter/facebook/website/etc)
- stats (`followerCount`, ratings, totalProducts, totalOrders, totalRevenue)
- `products[]` for showroom

---

## 3.4 Follow/unfollow shop

### `GET /api/shops/:shopId/follow`
- returns `isFollowing`

### `POST /api/shops/:shopId/follow`
- follow shop

### `DELETE /api/shops/:shopId/follow`
- unfollow shop

---

## 4) Seller search and filtering logic

Current web behavior is split:

1. **Marketplace feed filters** (`/api/marketplace/feed`)
   - product discovery, plus seller/shop filtering
2. **Shop directory search** (`/api/shops?search=...`)
   - direct seller/shop discovery

### Recommended mobile UX

Use two modes in one Search UI:

1. **Products tab**
   - call `/api/marketplace/feed` with `search`, `shop`, `seller`, etc.
2. **Shops tab**
   - call `/api/shops?search=...`

This avoids overloading one endpoint and gives better user clarity.

---

## 5) Copy seller link + share behavior

Web implementation:
- Component: `src/components/shop/ShareShopButton.tsx`
- Builds URL: `${NEXT_PUBLIC_SITE_URL}/shop/${shopSlug}`
- Supports:
  - native share sheet (if available)
  - copy link to clipboard
  - WhatsApp share link

### Mobile implementation recommendation

Use RN native APIs:
- `Share.share({ message, url })`
- Clipboard module for copy
- Optional direct WhatsApp deep link:
  - `https://wa.me/?text=<encoded_text_and_url>`

Keep this action visible on shop detail page for:
- seller owner/admin (as web does), and optionally
- all users if your product wants social sharing growth

---

## 6) Website and social links display

Website is exposed in shop payload:
- `socialLinks.website`

Web already renders website/social entries on shop page.

### Mobile recommendations

- Show a "Website" row only when URL exists
- Normalize if missing protocol (`https://`)
- Open in external browser (`Linking.openURL`)
- Also render other social links when present:
  - Instagram
  - WhatsApp
  - TikTok
  - Twitter/X
  - Facebook
  - YouTube
  - LinkedIn

---

## 7) Followers count behavior

Follower count source:
- `shop.stats.followerCount`
- also present in recommended shops and `/api/shops` dynamic stats

On follow/unfollow:
- update UI optimistically (+1 / -1)
- call `POST` or `DELETE /api/shops/:shopId/follow`
- rollback on failure

Show:
- count text (e.g., `12,400 followers`)
- follow state button (`Follow` / `Following`)

---

## 8) Recommended mobile screen structure

## 8.1 `SellerMarketplaceHomeScreen`

Purpose:
- product-first marketplace with seller filters

UI sections:
- search + advanced filters sheet
- tab chips (`All`, `Promo`, `Best Deals`)
- product grid
- featured shops carousel/grid

Endpoint:
- `/api/marketplace/feed`

---

## 8.2 `ShopsDirectoryScreen`

Purpose:
- dedicated seller directory discovery

UI sections:
- search input
- optional verified toggle
- shop cards list (infinite scroll)

Endpoint:
- `/api/shops`

---

## 8.3 `ShopDetailScreen`

Purpose:
- seller storefront profile + social trust + products

UI sections:
- hero/identity
- follower + verification stats
- follow button
- share/copy link button
- social/website links
- tabs (`Products`, `About`, `Reviews`)
- product listing

Endpoints:
- `/api/shops/slug/:slug`
- `/api/shops/:shopId/follow` (GET/POST/DELETE)

---

## 9) Suggested mobile API service methods

```ts
getMarketplaceFeed(params)
getShops(params)
getShopBySlug(slug)
getShopFollowStatus(shopId)
followShop(shopId)
unfollowShop(shopId)
```

Keep mapper functions to normalize backend payload to mobile view models.

---

## 10) Migration checklist (web -> mobile parity)

1. Build marketplace feed screen with all advanced filters
2. Build shops directory screen with search + pagination
3. Build shop detail screen with:
   - followers
   - website/social links
   - follow/unfollow
   - share/copy shop link
4. Add product card parity with seller row + shop link
5. Implement optimistic follow state updates
6. Add deep links:
   - `app://shop/:slug`
7. Add analytics events:
   - seller_search
   - shop_opened
   - follow_shop
   - share_shop_link
   - open_website

---

## 11) Backend improvements recommended (optional)

1. Add explicit `website` field at top-level in API response (mirror `socialLinks.website`) to simplify clients
2. Add `followers` alias for `stats.followerCount` for stable mobile naming
3. Add one endpoint for "seller discovery":
   - combines shop and seller match results in one response for global search UX
4. Include `isOwner` flag in `/api/shops/slug/:slug` to avoid client-side role logic duplication

---

## 12) Important implementation notes

1. `/seller/marketplace` currently reuses the same integrated marketplace component; mobile can do same by sharing one marketplace module for buyer/seller with role-based toggles.
2. Shop link copy/share is already production-ready on web; mirror behavior in RN using native share + clipboard.
3. Followers and website are already available in backend payloads; this is mostly mobile rendering and UX work, not backend invention.

