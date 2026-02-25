# Escrow & buyer reviews

## Escrow (payment hold)

Yes, the app is **escrow-based**:

- **Order model** (`src/models/Order.ts`): `escrowStatus`, `escrowReference`, `escrowHold` (amounts, status, holdReference).
- **Payment verify** (`src/app/api/payments/verify/route.ts`): After successful payment, **creates an escrow hold** via `escrow.createEscrowHold()` so funds are held, not sent straight to the seller.
- **Payout** (`src/app/api/payments/payout/route.ts`): **Releases escrow** to the seller only when:
  - Buyer has confirmed delivery (or admin overrides), and
  - `escrow.canReleaseEscrow(orderId)` passes.
- **Referral bonus**: Held until escrow is released, then unlocked (so rewards pay out after delivery).

So: pay → funds held in escrow → buyer confirms delivery (or admin) → escrow released to seller and referral bonuses unlocked.

## Buyer rating after delivery

- **Review page**: `/review?order=<orderId>` lets the buyer leave a **shop review** (rating + comment) for the order.
- **When to show “Leave review”**: Ideally this link is shown only when the order is **delivered** (or completed). In the buyer order detail / order list, show “Leave review” only when `order.status === 'delivered'` (or your equivalent “received” status).
- **Flow**: After delivery, buyer can rate the **shop** (and by extension the seller). Reviews are stored and can be shown on the shop/product (e.g. `reviewCount`, `averageRating`).

To enforce “only after delivery”, gate the “Leave review” button/link in the dashboard order views so it appears only when `status === 'delivered'` (or your completed status).
