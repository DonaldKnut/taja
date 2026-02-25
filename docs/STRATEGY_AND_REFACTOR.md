# Long-term strategy & refactor guide

## 1. Dojah NIN verification – why it might not be “working”

Your env is correct for **sandbox**:
- `DOJAH_APP_ID`, `DOJAH_API_KEY` (test key), `DOJAH_USE_SANDBOX=true`

**Sandbox behaviour:**
- Dojah **sandbox** only accepts **test data**. For NIN it usually only accepts the test NIN: **`70123456789`**.
- If users enter a **real** NIN (e.g. 45750891205), the sandbox API can reject or return an error, and the app correctly falls back to **manual verification** (KYC still submits, but `identityVerified: false` and admin reviews).

**Long-term approach:**
- **Testing:** Use NIN **70123456789** in sandbox to confirm Dojah flow end-to-end.
- **Production:** Switch to **production** Dojah keys, remove or set `DOJAH_USE_SANDBOX=false`, and use **production** base URL so real NINs are verified.
- **Manual fallback:** Keep the current behaviour: when Dojah fails or is not configured, KYC still submits with `requiresManualVerification` / `identityVerified: false` and admins review in the admin panel (no need to touch the DB for routine approvals).

---

## 2. Admin workflow – no need to go to DB every time

**Already in place:**
- **Admin panel:** `/admin/kyc` lists pending KYC; admin can **Approve** or **Reject** (with reason). This uses `PUT /api/admin/kyc/[userId]` and updates the user in the DB. Admins do **not** need to open MongoDB for normal KYC decisions.
- **Admin emails (so admins know what to do next):**
  - **KYC submitted:** `sendAdminKycSubmittedEmail(...)` is called when a user submits KYC (see `api/users/kyc/submit`). Sends to `ADMIN_EMAIL` or to all users with `role: 'admin'`. Ensure `RESEND_API_KEY` and `ADMIN_EMAIL` (or at least one admin user) are set in env.
  - **Shop created:** `sendAdminNewShopEmail(...)` is called when a shop is created. Same recipient logic.

**What to configure:**
- In `.env`: `ADMIN_EMAIL=your-admin@email.com` (and/or ensure you have at least one user with `role: 'admin'` so they get the emails).
- `RESEND_API_KEY` and `EMAIL_FROM` so Resend can send.
- Use **Admin → KYC** in the app to approve/reject; only use the DB for one-off fixes or bulk updates.

---

## 3. Token role: JWT vs DB – long-term strategy

**Current (and recommended) approach:** Auth middleware loads the **current** user from the DB and uses **DB role** (and email) for permission checks, not the role stored in the JWT.

**Why this is better long-term:**
- Admin can approve/reject KYC or change roles in the admin panel (or DB); the next API call immediately sees the new role without requiring the user to log out/in.
- Single source of truth: **DB** for role and account status; JWT is used only for identity (who is this user).

**Trade-off:** One extra DB read per authenticated request. For most apps this is acceptable; if you need to scale, you can add short-lived caching (e.g. in-memory or Redis) keyed by `userId` for role/status.

---

## 4. Paystack + wallet + escrow – how it’s wired and how to refactor

**Already implemented:**
- **Wallet deposit (Paystack):**
  - `POST /api/wallet/fund` – creates a pending `WalletTransaction`, calls `initializePayment('paystack', ...)`, returns `paymentUrl`. User pays on Paystack and is redirected back.
  - `GET /api/wallet/verify?reference=...` – Paystack redirects here; verifies payment via `verifyPayment('paystack', reference)`, marks the wallet transaction as success. Wallet balance is derived from `WalletTransaction` (e.g. sum of successful credits minus debits).
- **Debit buyers (checkout):**
  - Checkout flow uses `POST /api/payments/initialize` (order payment). After payment, `GET /api/payments/verify?reference=...&orderId=...` is called.
- **Escrow:**
  - In `payments/verify`: when payment is successful, `escrow.createEscrowHold(orderId, total, reference)` is called. Order gets `paymentStatus: 'paid'`, `escrowStatus: 'funded'`.
  - On delivery confirmation, `POST /api/payments/payout` (or equivalent) releases escrow to the seller via `escrow.releaseEscrowToSeller(orderId)` and can call Paystack transfer.

**What you need in `.env` for Paystack:**
- `PAYSTACK_SECRET_KEY` – server-side (initialize/verify, payouts).
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` – client-side if you use the Popup/Inline on the frontend.
- Optional: `PAYSTACK_BASE_URL` (defaults to production).

**Refactor / improvements you can do:**

1. **Wallet balance as a field**
   - Right now balance is likely computed from `WalletTransaction` every time. For performance, add a `walletBalanceKobo` (or similar) on the User model and update it on every wallet credit/debit. Use transactions so balance stays consistent.

2. **Debit buyers from wallet at checkout**
   - Add a payment method “Wallet” alongside Paystack. When the user chooses Wallet:
     - Check `user.walletBalanceKobo >= orderTotalKobo`.
     - Create a debit `WalletTransaction` and an escrow hold (same as for Paystack), then mark order as paid. No redirect to Paystack.

3. **Escrow and payouts**
   - Keep escrow in your DB (e.g. `escrowHold` on Order or a separate EscrowHold collection). On “confirm delivery”:
     - Call `escrow.releaseEscrowToSeller(orderId)`.
     - In that function: credit seller (wallet or Paystack transfer), update order, and optionally pay platform fee from the same hold.
   - For Paystack payouts to sellers: use your existing `lib/payments/paystack` (e.g. create recipient, then transfer). Ensure you have **Transfer** enabled in the Paystack dashboard and use the same Paystack keys.

4. **Transactions and idempotency**
   - For wallet and escrow, use DB transactions where you update multiple records (e.g. Order + WalletTransaction + User balance). Use a unique `reference` (or idempotency key) so double-clicks or duplicate webhooks don’t double-credit or double-debit.

5. **Webhooks**
   - Paystack can send webhooks for payment success. Add `POST /api/payments/webhook/paystack` (you may already have a webhook route). On success event, verify signature, then do the same logic as in `payments/verify` (update order, create escrow hold) so you’re not dependent only on redirects.

---

## 5. Checklist – “best strategy” summary

| Area | Recommendation |
|------|----------------|
| **Dojah** | Use sandbox + test NIN `70123456789` for testing; production keys + no sandbox for real NIN verification. |
| **Admin KYC** | Use `/admin/kyc` to approve/reject; no need to go to DB for each case. |
| **Admin emails** | Set `ADMIN_EMAIL` and `RESEND_API_KEY`; admins get email on KYC submit and on new shop. |
| **Role/permissions** | Keep using **DB role** in auth middleware so admin actions take effect immediately. |
| **Wallet** | Paystack already used for deposit; add wallet balance field and “Pay with Wallet” at checkout if desired. |
| **Escrow** | Already created on payment verify; release on delivery confirm; link payouts to Paystack transfers. |
| **Refactor** | Add wallet balance field, optional “Pay with Wallet”, DB transactions, and Paystack webhook for robustness. |

If you want, the next step can be implementing one of these (e.g. “Pay with Wallet” or webhook verification) in code.
