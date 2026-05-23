# Mobile Checkout UI + Endpoint Blueprint (Order-After-Payment Guarantee)

This document explains how mobile should implement checkout to match current web/backend behavior, including the guarantee that an order exists only after valid payment.

---

## 1) Objective

Mobile checkout must:

1. Collect shipping address
2. Show delivery slot options (when available)
3. Show order summary/totals
4. Complete Paystack payment
5. Create order only with verified payment reference
6. Route user to order details with confirmed status

---

## 2) Core endpoints for checkout

## Address and delivery setup

- `GET /api/users/addresses`  
  Load saved addresses for delivery.

- `POST /api/users/addresses`  
  Add new address during checkout.

- `PATCH /api/users/addresses` (current web usage) or `PUT /api/users/addresses/:id` (clean REST option)  
  Update address.

- `DELETE /api/users/addresses?addressId=<id>` or `DELETE /api/users/addresses/:id`  
  Remove address.

- `GET /api/shops/:shopId/delivery-slots`  
  Fetch available delivery slots and capacity.

## Payment and order

- `GET /api/payments/config`  
  Returns Paystack public key.

- `POST /api/orders`  
  Creates order **only after payment reference is supplied and verified**.

- `GET /api/orders/:id`  
  Fetch resulting order details after successful checkout.

---

## 3) Current web flow (source-aligned)

The current web checkout uses **Paystack inline payment first**, then creates order:

1. Build checkout payload from cart + selected address.
2. Load Paystack key using `GET /api/payments/config`.
3. Open Paystack modal with amount and buyer email.
4. On payment success callback, receive `reference`.
5. Call `POST /api/orders` with:
   - items
   - shippingAddress (address ID string is accepted)
   - paymentMethod: `paystack`
   - paymentReference: `<reference>` (required)
   - optional `deliverySlotId`, `couponCode`, `fromCart`
6. Backend verifies the payment reference with provider.
7. If verification passes, backend creates order with:
   - `paymentStatus: "paid"`
   - `status: "processing"`
8. Cart is cleared and user is redirected to order details.

---

## 4) `POST /api/orders` contract (mobile-critical)

## Request body (typical)

```json
{
  "items": [
    { "productId": "prod_1", "quantity": 2, "variantId": "var_1" }
  ],
  "shippingAddress": "address_id_here",
  "paymentMethod": "paystack",
  "paymentReference": "psk_ref_12345",
  "couponCode": "OPTIONAL",
  "deliverySlotId": "OPTIONAL",
  "fromCart": true
}
```

## Server-side guarantees

Backend validates all of the following before creating order:

1. Items exist and are purchasable
2. Shipping address is valid (if ID passed, it resolves from user profile)
3. Delivery slot is valid and not overbooked (when provided)
4. Payment reference is present
5. Payment provider verification succeeds
6. Paid amount matches expected amount (with small tolerance rules)

If any check fails, order is not created.

---

## 5) Why this guarantees “order after payment”

Current backend logic enforces:

- No `paymentReference` -> `400`
- Unverified or declined payment -> `400`
- Amount mismatch -> `400`
- Only after successful verification does it create order

So mobile should treat `POST /api/orders` as the single transactional gate that confirms payment and produces order.

---

## 6) Mobile UI structure (recommended)

Build checkout screen in these sections:

1. **Shipping Address**
   - list addresses
   - add/edit/delete inline modal/sheet
   - must select one before pay
2. **Delivery Logistics**
   - show slot chips/cards from delivery-slots endpoint
   - optional selection
3. **Order Summary**
   - item list
   - subtotal, shipping, VAT, discount, total
   - coupon input
4. **Payment Block**
   - Paystack branding + escrow trust copy
   - single CTA: `Complete Purchase`
5. **Post-payment Routing**
   - on success -> `/orders/:id`
   - on failure -> inline actionable error

---

## 7) End-to-end sequence for mobile implementation

1. Load cart from local/mobile store.
2. `GET /api/users/addresses`.
3. Determine shopId for cart and call `GET /api/shops/:shopId/delivery-slots`.
4. User taps pay.
5. `GET /api/payments/config` for Paystack key.
6. Open Paystack checkout with total amount (kobo).
7. On gateway success, capture `reference`.
8. Call `POST /api/orders` with `paymentReference`.
9. If success:
   - clear mobile cart
   - optionally call cart clear endpoint if used by app
   - navigate to order details via returned `_id`
10. Fetch order using `GET /api/orders/:id` and display payment/order status.

---

## 8) Error states mobile must handle

1. Missing address
2. Empty cart
3. Payment cancelled by user
4. Payment success but `POST /api/orders` fails (show “contact support” + retry action)
5. Delivery slot full/expired
6. Amount mismatch or verification failure

Recommended UX:

- show stage-based errors: `payment-init`, `gateway`, `order-create`
- include backend message and reference for support

---

## 9) Additional payment endpoints (important for reliability)

These exist in backend and support asynchronous reconciliation:

- `POST /api/payments/webhook/paystack`
- `POST /api/payments/webhook/flutterwave`
- `GET /api/payments/verify` and `POST /api/payments/verify`

Mobile does not need to call webhook endpoints directly.  
They are for gateway-to-server confirmation and recovery scenarios.

---

## 10) Mobile acceptance checklist

Checkout is parity-ready when mobile can:

1. Manage addresses inside checkout
2. Show and select delivery slots
3. Initialize Paystack with server-provided public key
4. Submit `POST /api/orders` with payment reference only after gateway success
5. Handle backend verification failures without creating phantom orders
6. Land user on real order details page with paid/processing status

