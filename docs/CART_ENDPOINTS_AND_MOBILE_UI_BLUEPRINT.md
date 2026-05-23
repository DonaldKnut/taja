# Cart Endpoints + Mobile UI Blueprint

This guide explains:

1. Which cart endpoints are consumed.
2. How add / subtract quantity should behave (`+` and `-`).
3. A mobile-first UI spec based on your screenshot.
4. A “first purchase special” slider behavior with bigger images.

---

## 1) Cart endpoints currently available

From `src/lib/api.ts` and API routes under `src/app/api/cart/*`.

## A) Get cart

- **Method:** `GET`
- **Path:** `/api/cart`
- **Use:** Load current authenticated user cart.

Returns cart with `items[]` and `totals`.

---

## B) Add item to cart

- **Method:** `POST`
- **Path:** `/api/cart`
- **Body:**

```json
{
  "productId": "PRODUCT_ID",
  "quantity": 1
}
```

- **Use:** Add new item or increase existing item quantity.

---

## C) Update quantity

- **Method:** `PUT`
- **Path:** `/api/cart/{itemId}`
- **Body:**

```json
{
  "quantity": 3
}
```

- **Use:** Set an exact quantity for existing cart line.

---

## D) Remove one line item

- **Method:** `DELETE`
- **Path:** `/api/cart/{itemId}`
- **Use:** Delete a specific line from cart.

---

## E) Clear whole cart

- **Method:** `DELETE`
- **Path:** `/api/cart`
- **Use:** Remove all cart items.

---

## F) Merge guest/local cart into account cart

- **Method:** `POST`
- **Path:** `/api/cart/merge`
- **Body:**

```json
{
  "items": [
    { "product": "PRODUCT_ID_1", "quantity": 2 },
    { "product": "PRODUCT_ID_2", "quantity": 1 }
  ]
}
```

- **Use:** On login, merge device cart into server cart.

---

## 2) Quantity behavior (`+` / `-`) blueprint

Use same logic as web cart store (`src/stores/cartStore.ts`) + cart item UI (`src/components/cart/CartItem.tsx`).

## Core rules

- `+` increases by 1, but never beyond stock.
- `-` decreases by 1, but should not go below MOQ.
- If user tries below MOQ:
  - Keep at MOQ and show warning, **or**
  - If your UX prefers removal when user goes below 1, only remove at `0`.
- Manual typing should be sanitized and clamped:
  - clamp to `>= MOQ`
  - clamp to `<= stock`

## Recommended RN behavior

- Tap `+`:
  - `next = min(current + 1, stock)`
- Tap `-`:
  - if `current > MOQ`: `next = current - 1`
  - else show “Minimum order is X”
- Long-press `-` (optional):
  - show “Remove item?” action for quick delete.

---

## 3) Suggested response-to-UI mapping

Map each cart line with:

- title: product name (or variant name if selected)
- merchant/shop label
- unit price
- quantity
- stock and MOQ hints
- thumbnail image

Compute:

- Line total = `unitPrice * quantity`
- Cart total = sum of all line totals

---

## 4) Mobile cart UI blueprint (from your screenshot)

## Layout blocks

1. Header (`Mon Panier` / `My Cart`)
2. Vertical card list of cart items
3. Sticky bottom summary bar:
   - total on left
   - pay button on right

## Cart row card

For each line:

- left: product image
- center:
  - store name
  - product name
  - quantity row with `- qty +`
- right:
  - unit price
  - line total
  - optional delete icon

---

## 5) “First purchase special” slider (bigger image)

Your request: first purchase should feel special with bigger image slider.

## Recommended implementation

- First card in cart list (`index === 0`) becomes **hero cart card**.
- Hero card differences:
  - image area larger (e.g., 96-120 px vs 64-72 px on other rows)
  - if multiple images exist, show horizontal mini-slider
  - stronger shadow + subtle accent border
  - optional label: `Featured in this order`

## Slider behavior (first item only)

- Show image pager dots only for first card.
- Swipe left/right on image to preview product images.
- Keep quantity and price controls below/next to image.

## Fallback

- If first item has only one image, still keep bigger image style but no pager.

---

## 6) RN component structure suggestion

- `CartScreen`
  - `CartHeader`
  - `FlatList<CartItem>`
    - `CartItemHero` for index `0`
    - `CartItemRow` for others
  - `CartSummaryBar` (sticky bottom)

---

## 7) Pseudocode for add/subtract flow

```ts
function onPlus(item) {
  const next = Math.min(item.quantity + 1, item.stock);
  if (next === item.quantity) toast("Stock limit reached");
  else updateQuantity(item.id, next); // PUT /api/cart/:itemId
}

function onMinus(item) {
  if (item.quantity > item.moq) {
    updateQuantity(item.id, item.quantity - 1); // PUT /api/cart/:itemId
  } else {
    toast(`Minimum order is ${item.moq}`);
  }
}
```

---

## 8) Auth + sync notes

- Cart endpoints require auth.
- For guest carts:
  - keep local cart state
  - on login call `/api/cart/merge`
  - refresh with `/api/cart`

---

## 9) Optional UX extras

- Haptic feedback on `+` / `-`.
- Disable pay button when MOQ constraints fail.
- Show stock warning inline near quantity controls.
- Animate first hero card image (gentle scale/parallax) to emphasize premium feel.

