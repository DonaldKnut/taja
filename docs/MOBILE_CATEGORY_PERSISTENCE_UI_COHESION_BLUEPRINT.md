# Mobile Category Persistence + UI Cohesion Blueprint

This document explains the updated backend contract for shop categories and exactly how mobile UI should consume it for stable, non-breaking behavior.

It is designed to keep old web clients working while giving mobile strong persistence guarantees.

---

## 1) Final contract (implemented)

### Create / update shop accepts both old and new inputs

`POST /api/shops` and `PUT /api/shops/:shopId` now support:

- `category: string` (legacy/old clients)
- `categories: string[]` (recommended source of truth)

Backend behavior:

1. Trims and collapses whitespace for each category name.
2. Dedupes case-insensitively (`beauty`, ` Beauty `, `BEAUTY` => one logical category).
3. Reuses existing category records by case-insensitive name match.
4. Creates missing category records in `Category` collection when needed.
5. Persists:
   - `shop.categories` (canonical names array)
   - `shop.categoryIds` (linked category IDs)
   - `shop.category` (primary/first category for backward compatibility)

This is additive and non-breaking.

### Shop responses now expose both compatibility and richer fields

Shop APIs now return:

- `category` (legacy single string)
- `categories: string[]` (normalized array)
- `categoryIds: string[]` (canonical IDs)

This applies in:

- `POST /api/shops` response
- `PUT /api/shops/:shopId` response
- `GET /api/shops`
- `GET /api/shops/:shopId`
- `GET /api/shops/my`
- `GET /api/shops/slug/:slug`

---

## 2) Endpoints mobile should use

## 2.1 Fetch selectable categories

### `GET /api/seller/categories`

Use this for the searchable category picker.

Auth: seller/admin bearer token required.

Response:

```json
{
  "success": true,
  "data": [
    {
      "_id": "cat_1",
      "name": "Beauty",
      "slug": "beauty"
    }
  ]
}
```

## 2.2 Create shop

### `POST /api/shops`

Always send `categories` as names:

```json
{
  "shopName": "My Shop",
  "shopSlug": "my-shop",
  "categories": ["Beauty", "Skincare"]
}
```

Optionally include `category` for extra legacy safety, but it is no longer required if `categories` is present.

## 2.3 Update shop

### `PUT /api/shops/:shopId`

Send updated `categories` array when user edits category selection. Backend will normalize and persist canonically.

## 2.4 Read current shop

### `GET /api/shops/my`

Use returned `categories` to hydrate edit screen state.

---

## 3) Mobile UI interaction flow (recommended)

## 3.1 Shop setup (create flow)

1. On step open, call `GET /api/seller/categories`.
2. Show searchable list of category names.
3. If no exact match, show CTA: `Use "<typed text>"`.
4. Add picked/new values into local `selectedCategories: string[]`.
5. On submit, call `POST /api/shops` with:
   - required shop fields
   - `categories: selectedCategories`
6. On success:
   - trust `response.data.categories` as canonical display state
   - store `response.data.categoryIds` for future analytics/filtering use
   - continue normal navigation (under-review/dashboard flow)

## 3.2 Shop edit flow

1. Prefill chips using `GET /api/shops/my` -> `data.categories`.
2. Keep same picker UX as create flow.
3. Save with `PUT /api/shops/:shopId` and include full `categories` array (not only delta).
4. Replace local state with server response categories after save.

## 3.3 Viewer/browse flow

For shop cards/details, render:

- Primary badge from `categories[0]` (fallback: `category`).
- Multi-category chips from `categories`.

When filtering shop list by category, call:

- `GET /api/shops?category=<name>`

Server now matches both legacy `category` and new `categories`.

---

## 4) UI cohesion rules (web + mobile parity)

1. **Single source of truth in client payload:** always send `categories` names.
2. **Display server-canonical values:** after save, replace local categories with response categories.
3. **Do not force category IDs in request:** IDs are backend-managed enrichment.
4. **Preserve free-text UX:** custom categories are valid input and should not block submission.
5. **Case behavior:** keep user-friendly casing in UI, but trust backend to dedupe/normalize.
6. **No breaking assumptions:** older web clients still using `category` continue to work.

---

## 5) Example request/response contracts

## Case A: Existing category

Request:

```json
{
  "shopName": "Glow Place",
  "shopSlug": "glow-place",
  "categories": ["beauty"]
}
```

Possible response excerpt:

```json
{
  "success": true,
  "data": {
    "category": "Beauty",
    "categories": ["Beauty"],
    "categoryIds": ["66ffabc123..."]
  }
}
```

## Case B: New custom category

Request:

```json
{
  "shopName": "Nature Oils",
  "shopSlug": "nature-oils",
  "categories": ["Organic Oils"]
}
```

Response excerpt:

```json
{
  "success": true,
  "data": {
    "category": "Organic Oils",
    "categories": ["Organic Oils"],
    "categoryIds": ["6700def456..."]
  }
}
```

---

## 6) Implementation notes for mobile engineers

- Keep a `CategoryPicker` component that works with plain strings.
- Add client-side dedupe for better UX, but do not rely on it for correctness.
- Continue to support offline draft state as string arrays.
- Prefer optimistic UI only for chip visuals; authoritative list should be refreshed from server response.

---

## 7) Rollout safety

- Backward compatibility is preserved because `category` is still accepted and returned.
- New clients should migrate to reading/writing `categories` first.
- `categoryIds` can be adopted gradually for future taxonomy features (advanced analytics, strict filtering, admin tooling).
