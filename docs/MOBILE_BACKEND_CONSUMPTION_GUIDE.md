# Mobile Backend Consumption Guide (React Native)

This guide defines how the mobile app should consume this backend safely and consistently.

---

## 1) Base URL and headers

- Base URL: `EXPO_PUBLIC_API_BASE_URL` (example: `https://tajaapp.shop`)
- Default headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` for authenticated requests

Auth parser on backend accepts Bearer case-insensitively and can fallback to `token` cookie for web; mobile should still always send Authorization header.

---

## 2) Standard response handling

Most endpoints follow:

```json
{
  "success": true,
  "message": "optional",
  "data": {}
}
```

Mobile parser recommendation:

1. Prefer `response.data` when `response.success === true`
2. Handle `4xx/5xx` by message:
   - `Unauthorized: missing token`
   - `Unauthorized: invalid token`
   - validation messages (`Validation error: ...`)

---

## 3) Cart contract (canonical)

## Fetch cart

- `GET /api/cart`

Success shape:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "itemId": "string",
        "productId": "string",
        "title": "string",
        "unitPrice": 1000,
        "quantity": 2,
        "subtotal": 2000,
        "stock": 10,
        "moq": 1,
        "images": ["..."],
        "variantId": "optional",
        "variantName": "optional"
      }
    ],
    "totals": {
      "subtotal": 2000,
      "total": 2000
    }
  }
}
```

## Add line item

- `POST /api/cart`

Body:

```json
{
  "productId": "string",
  "quantity": 1,
  "variantId": "optional",
  "variantName": "optional"
}
```

## Update quantity

- `PUT /api/cart/:itemId`

Body:

```json
{
  "quantity": 3
}
```

## Remove line item

- `DELETE /api/cart/:itemId`

## Clear cart

- `DELETE /api/cart`

## Merge local cart after login

- `POST /api/cart/merge`

Body:

```json
{
  "items": [
    { "product": "productId", "quantity": 2, "variantId": "optional", "variantName": "optional" }
  ]
}
```

---

## 4) Quantity UX rules for mobile

- `+`: increase by 1 up to `stock`
- `-`: decrease by 1 but not below `moq`
- show clear warning if:
  - `quantity < moq`
  - `quantity > stock`

If user types manually, clamp to `[moq, stock]`.

---

## 5) Product listing and detail consumption

## Marketplace cards

- `GET /api/marketplace/feed`
- Use `data.products[]` for cards
- Use `variants[]` to show Options CTA

## Product detail

- preferred: `GET /api/products/slug/:slug`
- current web helper also uses: `GET /api/products/:idOrSlug`

Then load:

- reviews: `GET /api/reviews?productId=<id>`
- recommendations: `GET /api/ai/recommendations?type=similar&productId=<id>&limit=4`

---

## 6) Safe client implementation pattern

Use one API wrapper:

1. attach auth header if token exists
2. parse envelope safely
3. normalize per endpoint into app models
4. centralize token-expired handling (`401`)

Pseudo:

```ts
const res = await fetch(url, opts);
const json = await res.json();
if (!res.ok || json?.success === false) throw new Error(json?.message || "Request failed");
return json?.data ?? json;
```

---

## 7) Environment checklist

- Confirm `EXPO_PUBLIC_API_BASE_URL` points to production backend origin.
- Confirm mobile stores/retrieves access token after login.
- Confirm every protected request sends `Authorization: Bearer <token>`.
- On login restore, call `GET /api/cart`, and if local items exist call `/api/cart/merge` first.

---

## 8) Recommended docs to keep in sync

- `docs/CART_ENDPOINTS_AND_MOBILE_UI_BLUEPRINT.md`
- `docs/RN_PRODUCT_CARD_OPTIONS_BLUEPRINT.md`
- `docs/PRODUCT_DETAIL_ENDPOINT_CONSUMPTION.md`

