# Orders Mobile UI + Endpoint Blueprint

This document explains:

1. How the current web order UI works (buyer + seller)
2. Which backend endpoints are consumed
3. How mobile should consume these endpoints
4. Recommended mobile UI structure and state handling

---

## 1) Auth and base contract

All order endpoints are protected.

- Header: `Authorization: Bearer <access_token>`
- Content type for JSON routes: `application/json`

Common envelope:

```json
{
  "success": true,
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 2) Core order endpoints

## 2.1 List orders

### `GET /api/orders`

Query params:
- `page` (default 1)
- `limit` (default 20)
- `status` (optional)
- `role` (`buyer` or `seller`)

Examples:
- Buyer list: `/api/orders?role=buyer&page=1&limit=20`
- Seller list: `/api/orders?role=seller&page=1&limit=100`

Response:

```json
{
  "success": true,
  "data": {
    "orders": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

---

## 2.2 Get one order detail

### `GET /api/orders/:id`

- Authorizes buyer, seller, or admin for that order
- Returns populated order with buyer/seller/shop/items/timeline/delivery/totals

---

## 2.3 Seller updates order status

### `PATCH /api/orders/:id/status`

Payload:

```json
{
  "status": "confirmed"
}
```

Allowed statuses:
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `delivered`
- `completed`
- `cancelled`
- `refunded`
- `disputed`

Rule:
- Seller cannot set `delivered` directly (buyer/admin confirmation required)

Possible response for violation:

```json
{
  "success": false,
  "code": "DELIVERY_CONFIRMATION_REQUIRED",
  "message": "Only the buyer (or admin) can confirm delivery..."
}
```

---

## 2.4 Buyer confirms delivery

### `POST /api/orders/:id/confirm-delivery`

Purpose:
- buyer confirms item received
- order moves to delivered flow
- buyer points may be awarded

Response includes updated order + `pointsEarned`.

---

## 2.5 Seller uploads tracking

### `POST /api/orders/:id/tracking`

Payload:

```json
{
  "trackingNumber": "ABC12345",
  "carrier": "kwik",
  "trackingUrl": "optional",
  "estimatedDelivery": "2026-04-10T12:00:00.000Z",
  "sellerNotes": "optional"
}
```

Notes:
- Requires seller ownership of order
- Requires paid order
- Sets order to `shipped`

### `PUT /api/orders/:id/tracking`

Updates existing tracking fields.

---

## 2.6 Read tracking views

### `GET /api/tracking/order/:orderId`
### `GET /api/tracking/:trackingNumber`

Returns:
- order status
- delivery info
- generated tracking history timeline

Use `tracking/order/:orderId` for in-app order detail since you already have order ID.

---

## 3) Current web UI behavior (reference)

## 3.1 Buyer orders list

Web file: `src/app/dashboard/orders/page.tsx`

Flow:
- Calls `GET /api/orders?role=buyer`
- Client-side filters by:
  - search term
  - status
  - date range
  - sort (newest/oldest/highest/lowest)

Card fields shown:
- order number
- status + payment status
- amount
- date
- items preview
- shipping summary

---

## 3.2 Buyer order detail

Web file: `src/app/dashboard/orders/[id]/page.tsx`

Flow:
- Calls `GET /api/orders/:id`
- Displays:
  - status hero card
  - timeline history (`order.timeline`)
  - item list and subtotals
  - totals summary
  - seller/shop info + chat/whatsapp links
  - shipping address

Primary action:
- `Confirm Delivery` -> `POST /api/orders/:id/confirm-delivery`

Optional follow-up:
- payout action (web currently calls `/api/payments/payout` after confirm flow)

---

## 3.3 Seller orders list

Web file: `src/app/seller/orders/page.tsx`

Flow:
- Calls `GET /api/orders?role=seller`
- Status progression buttons based on current status:
  - pending -> confirmed
  - confirmed -> processing
  - processing -> shipped
- Updates via `PATCH /api/orders/:id/status`

---

## 3.4 Seller order detail

Web file: `src/app/seller/orders/[id]/page.tsx`

Flow:
- Calls `GET /api/orders/:id`
- Displays buyer info, items, timeline, shipping, payment summary
- Shows status action buttons from seller status flow

---

## 4) Mobile UI blueprint

## 4.1 Buyer mobile screens

1. **OrdersListScreen**
   - tabs/chips: `All`, `Pending`, `Shipped`, `Delivered`, `Cancelled`
   - cards with:
     - order number
     - date
     - total
     - status badge
     - up to 3 item thumbnails

2. **OrderDetailScreen**
   - sections:
     - status + ETA
     - timeline
     - items
     - payment summary
     - shipping address
     - seller actions (chat/contact/shop)
   - CTA:
     - `Confirm delivery` when eligible

3. **TrackingScreen** (optional dedicated)
   - consume `/api/tracking/order/:orderId`
   - vertical progress timeline

---

## 4.2 Seller mobile screens

1. **SellerOrdersScreen**
   - filter chips by status
   - order cards with:
     - buyer name
     - order number
     - amount
     - status
     - quick-action button (next status)

2. **SellerOrderDetailScreen**
   - sections:
     - buyer info
     - items
     - shipping
     - payment summary
     - timeline
   - actions:
     - status updates
     - upload tracking

3. **UploadTrackingModal**
   - form fields:
     - carrier
     - tracking number
     - optional URL
     - optional estimated delivery date
     - seller note

---

## 5) Mobile API consumption patterns

## 5.1 Service methods (recommended)

- `getOrders({ role, page, limit, status })`
- `getOrder(orderId)`
- `updateOrderStatus(orderId, status)`
- `confirmDelivery(orderId)`
- `uploadTracking(orderId, payload)`
- `updateTracking(orderId, payload)`
- `getTrackingByOrder(orderId)`

---

## 5.2 Pagination strategy

For order list:
- request server-side pagination
- implement infinite scroll (`page + 1`)
- merge unique orders by `_id`

Avoid loading `limit=100` on low-end devices unless needed.

---

## 5.3 Optimistic updates

Seller status buttons can be optimistic:

1. update local status immediately
2. call PATCH endpoint
3. revert if API fails

For buyer confirm-delivery:
- safer to wait for server response before final UI state.

---

## 5.4 Error handling

Handle these specifically:

- `401`: token expired -> refresh/relogin
- `403`: unauthorized order access
- `404`: order not found
- `400`: invalid transitions (e.g. shipped unpaid order)
- `DELIVERY_CONFIRMATION_REQUIRED`: show friendly seller guidance

---

## 6) Suggested RN state models

```ts
type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

interface OrderListItemVM {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemCount: number;
  previewImages: string[];
}
```

Keep a mapper layer so UI is decoupled from raw backend shape.

---

## 7) UX recommendations for mobile

1. Use clear status chips with color + icon
2. Show a compact timeline on list cards for active orders
3. Keep primary CTA sticky on detail screen:
   - Buyer: Confirm delivery
   - Seller: Move to next status / Upload tracking
4. Add "pull to refresh" on all order screens
5. Preserve order detail cache for fast reopen (SWR/react-query)

---

## 8) Implementation order (mobile team)

1. Build order API service + typed models
2. Implement buyer order list + detail
3. Add seller list + status transitions
4. Add tracking upload/read flow
5. Add robust error mapping + retry UX
6. Add analytics events:
   - order_opened
   - order_confirm_delivery_clicked
   - seller_status_updated
   - tracking_uploaded

---

## 9) Known backend realities to account for

1. Some timeline/tracking fields are computed server-side; do not assume every delivery field is always present.
2. Status update is duplicated in `PUT /api/orders/:id` and `PATCH /api/orders/:id/status`; mobile should standardize on `PATCH /api/orders/:id/status`.
3. Buyer confirmation and payout logic can be separate steps; keep UI messaging explicit around escrow release.

