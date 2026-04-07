# Mobile Checkout Backend Requirements Status (Paystack + Order-After-Payment)

This is a paste-ready backend contract/status doc for mobile checkout implementation.

---

## Executive status

Short answer: **partially**.

### Already available

1. `POST /api/orders` enforces order-after-payment (requires and verifies `paymentReference` for Paystack).
2. `POST /api/payments/verify` exists.
3. Payment webhooks exist for reconciliation:
   - `POST /api/payments/webhook/paystack`
   - `POST /api/payments/webhook/flutterwave`

### Missing for your requested mobile UX

1. `POST /api/payments/checkout/init` **does not exist**.
2. Current `POST /api/payments/initialize` is order-based (`orderId` required), not cart-intent based.
3. `POST /api/payments/verify` response is webhook-style, not yet mobile-friendly verification payload contract.
4. No explicit mobile deep-link return contract in payment init response.
5. Standardized error codes (`PAYMENT_AMOUNT_MISMATCH`, etc.) are not consistently returned yet.

---

## Contract decision for mobile parity

To remove manual payment-reference entry and keep reliability:

1. Add new endpoint `POST /api/payments/checkout/init` for mobile checkout intents.
2. Keep `POST /api/orders` as final source-of-truth gate (already correct).
3. Optionally improve `POST /api/payments/verify` response shape for mobile pre-finalization UX.
4. Support deep-link return URL in init metadata.

---

## Required endpoint 1 (new): `POST /api/payments/checkout/init`

Purpose: Initialize Paystack checkout from cart intent and return server-issued `reference + checkoutUrl` tied to expected amount.

### Request

```json
{
  "items": [
    { "productId": "prod_1", "quantity": 2, "variantId": "var_1" }
  ],
  "shippingAddress": "address_id_here",
  "couponCode": "OPTIONAL",
  "deliverySlotId": "OPTIONAL",
  "fromCart": true,
  "channel": "mobile",
  "returnUrl": "taja://checkout/complete"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "provider": "paystack",
    "checkoutUrl": "https://checkout.paystack.com/...",
    "reference": "psk_ref_12345",
    "amount": 450000,
    "currency": "NGN",
    "expiresAt": "2026-04-08T12:00:00.000Z"
  }
}
```

### Backend rules

1. Reuse same pricing engine used by `POST /api/orders` (subtotal/shipping/tax/slot checks).
2. Generate reference server-side.
3. Persist checkout intent with:
   - userId
   - normalized order payload
   - expected amount (kobo)
   - currency
   - expiry
   - status (`initialized`)
4. Return gateway URL and reference.
5. Reject invalid address/slot/items before returning URL.

---

## Endpoint 2 (upgrade): `POST /api/payments/verify`

Current endpoint exists, but should also support mobile verification output.

### Mobile request (recommended support)

```json
{
  "reference": "psk_ref_12345",
  "provider": "paystack"
}
```

### Mobile response (recommended)

```json
{
  "success": true,
  "data": {
    "verified": true,
    "status": "success",
    "amount": 450000,
    "currency": "NGN",
    "reference": "psk_ref_12345"
  }
}
```

This gives mobile immediate UX feedback before `POST /api/orders`.

---

## Endpoint 3 (keep): `POST /api/orders`

This is already the final transactional gate and should remain so.

### Required request

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

### Current behavior confirmed

1. Rejects missing reference.
2. Verifies with provider.
3. Rejects amount mismatch.
4. Creates order only after payment verification.
5. Marks order as paid/processing and clears cart when `fromCart` is true.

---

## Deep-link return requirement

Support return URL through init endpoint, e.g.

- `taja://checkout/complete?reference=psk_ref_12345&status=success`
- universal link equivalent also acceptable.

This removes manual reference entry and enables in-app finalization.

---

## Error contract (recommended standardization)

Use this payload shape:

```json
{
  "success": false,
  "code": "PAYMENT_AMOUNT_MISMATCH",
  "message": "Paid amount does not match expected amount."
}
```

Recommended codes:

- `PAYMENT_INIT_FAILED`
- `PAYMENT_CANCELLED`
- `PAYMENT_NOT_VERIFIED`
- `PAYMENT_AMOUNT_MISMATCH`
- `DELIVERY_SLOT_UNAVAILABLE`
- `ADDRESS_INVALID`
- `CHECKOUT_EXPIRED`

---

## Mobile implementation flow (once init endpoint is added)

1. User selects address and optional delivery slot.
2. Mobile calls `POST /api/payments/checkout/init`.
3. Mobile opens returned `checkoutUrl`.
4. Gateway returns to app via deep link.
5. Mobile optionally calls `POST /api/payments/verify`.
6. Mobile calls `POST /api/orders` with same `paymentReference`.
7. On success, navigate to order details.

---

## Acceptance criteria

Backend is mobile-ready when:

1. `POST /api/payments/checkout/init` returns usable `checkoutUrl + reference`.
2. `POST /api/orders` accepts that reference after successful payment and creates paid/processing order.
3. Invalid/expired/mismatched reference never creates order.
4. `POST /api/payments/verify` can return clear mobile verification state.
5. Deep-link return enables in-app completion without manual reference entry.

