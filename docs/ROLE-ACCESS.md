# Role-based access: seller vs buyer vs admin

Who can access which pages and APIs.

## Middleware (auth only)

**File:** `src/middleware.ts`

- Only checks that the user has a **token** (cookie) for protected paths.
- Does **not** check role. Role checks happen in layouts and API routes.

**Protected paths (require login):** any path starting with:

- `/dashboard` – buyer dashboard
- `/checkout`
- `/seller` – seller area
- `/admin` – admin area

No token → redirect to `/login?redirect=<path>`.

---

## Page-level restrictions (layouts + ProtectedRoute)

Enforcement is in **layouts** via `<ProtectedRoute requiredRole="…">`.

### Buyer

**Allowed:**

- `/` (home), `/marketplace`, `/shop/[slug]`, `/product/…`, `/cart`, `/how-it-works`, etc.
- `/dashboard` and all under it:  
  `/dashboard/orders`, `/dashboard/addresses`, `/dashboard/wishlist`, `/dashboard/profile`, `/dashboard/settings`, `/dashboard/payment-methods`, `/dashboard/try-on`, `/dashboard/products/new`
- `/checkout`

**Restricted (redirected away):**

- `/seller/*` → redirected to `/dashboard`
- `/admin/*` → redirected to `/dashboard`

**Layout:** `src/app/dashboard/layout.tsx` uses `requiredRole={["buyer", "admin"]}` so only buyers and admins see the buyer dashboard. Sellers are redirected to `/seller/dashboard`.

---

### Seller

**Allowed:**

- Same public pages as buyer (home, marketplace, shop, product, cart, etc.)
- `/seller` (landing), `/seller/dashboard`, `/seller/products`, `/seller/products/new`, `/seller/products/[id]/edit`, `/seller/orders`, `/seller/logistics`, `/seller/analytics`, `/seller/setup`, `/seller/verification`
- `/onboarding/kyc` (when flow sends them there)
- `/checkout` (sellers can buy too)

**Restricted (redirected away):**

- `/dashboard` and all buyer dashboard pages → redirected to `/seller/dashboard`
- `/admin/*` → redirected to `/dashboard`

**Layout:** `src/app/seller/layout.tsx` uses `requiredRole="seller"`. Non-sellers (buyer, admin) hitting any `/seller/*` are redirected: sellers go to `/seller/dashboard`, others to `/dashboard`.

---

### Admin

**Allowed:**

- All public pages
- `/dashboard` (buyer dashboard, same as buyer)
- `/admin/*`: `/admin/dashboard`, `/admin/kyc`, `/admin/users`, `/admin/orders`, `/admin/products`, `/admin/analytics`, `/admin/settings`
- `/checkout`

**Restricted:**

- `/seller/*` → redirected to `/dashboard` (admin cannot use seller UI; use admin panels instead)

**Layout:** `src/app/admin/layout.tsx` uses `requiredRole="admin"`. Non-admins are redirected to `/dashboard` or `/seller/dashboard` depending on their role.

---

## API restrictions

**File:** `src/lib/middleware.ts` – `requireAuth` (any logged-in user) and `requireRole(allowedRoles)`.

| Route / area              | Allowed roles   |
|---------------------------|-----------------|
| `/api/users/me`, `/api/auth/profile`, `/api/orders`, `/api/cart`, `/api/verify/identity`, `/api/payments/initialize`, etc. | Any (requireAuth) |
| `/api/shops` POST (create shop) | Any (requireAuth); buyer is promoted to seller |
| `/api/products` POST (create product) | seller, admin |
| `/api/seller/dashboard`, `/api/seller/analytics` | seller, admin |
| `/api/users/kyc/submit`   | seller          |
| `/api/admin/*` (users, kyc, stats, categories, etc.) | admin |

---

## Summary table

| Role   | Buyer dashboard (`/dashboard`) | Seller area (`/seller`) | Admin (`/admin`) |
|--------|---------------------------------|--------------------------|-------------------|
| buyer  | ✅ Yes                          | ❌ No → /dashboard        | ❌ No → /dashboard |
| seller | ❌ No → /seller/dashboard       | ✅ Yes                   | ❌ No → /dashboard |
| admin  | ✅ Yes                          | ❌ No → /dashboard        | ✅ Yes            |
