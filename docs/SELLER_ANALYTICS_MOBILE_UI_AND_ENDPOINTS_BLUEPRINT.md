# Seller Analytics Mobile UI + Endpoints Blueprint

Yes — analytics UI and endpoints already exist on web/backend.

This doc gives mobile a direct implementation map for a working seller analytics screen with web parity.

---

## 1) Existing analytics surfaces

## Web UI

- Seller analytics page: `src/app/seller/analytics/page.tsx`
- Period filters used in UI: `7d`, `30d`, `90d`, `all`
- Sections rendered:
  1. KPI cards
  2. Revenue trend chart
  3. Orders trend chart
  4. Top products list
  5. Orders-by-status breakdown
  6. Revenue-by-payment-method breakdown

## Backend APIs

1. `GET /api/seller/analytics` (primary endpoint used by seller analytics page)
2. `GET /api/shops/:shopId/analytics` (shop-scoped fallback/secondary analytics endpoint)

---

## 2) Primary endpoint contract (mobile should use this)

## `GET /api/seller/analytics?period=<value>`

**Auth:** seller/admin bearer token required.

**Query param**

- `period`: `7d | 30d | 90d | 1y | all`
  - Note: web UI currently shows `7d`, `30d`, `90d`, `all`.
  - Backend also supports `1y`.

**Response shape**

```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRevenue": 0,
      "totalOrders": 0,
      "totalProducts": 0,
      "averageRating": 0,
      "reviewCount": 0,
      "followerCount": 0,
      "revenueChange": 0,
      "ordersChange": 0
    },
    "period": {
      "orders": 0,
      "revenue": 0
    },
    "charts": {
      "revenueByDay": [{ "date": "2026-04-01", "revenue": 0 }],
      "ordersByDay": [{ "date": "2026-04-01", "orders": 0 }],
      "topProducts": [{ "name": "Product A", "revenue": 0, "orders": 0, "image": "..." }],
      "ordersByStatus": [{ "status": "pending", "count": 0 }],
      "revenueByPaymentMethod": [{ "method": "paystack", "revenue": 0 }]
    },
    "shop": {
      "_id": "...",
      "shopName": "...",
      "shopSlug": "..."
    }
  }
}
```

---

## 3) Secondary endpoint (optional/fallback)

## `GET /api/shops/:shopId/analytics?period=<value>`

Use when you already have shopId and need:

- `stats` and period summary (`period.orders`, `period.revenue`)
- `shop` metadata/status

This endpoint is narrower than `/api/seller/analytics` (it does not return full charts payload).

---

## 4) Mobile UI implementation map (exact parity)

## 4.1 Header + period chips

- Title: “Shop Performance”
- Period chips: `7d`, `30d`, `90d`, `all`
- On chip change -> refetch `GET /api/seller/analytics?period=...`

## 4.2 KPI cards

Render from `data.stats`:

1. Total Revenue (+/- `revenueChange`)
2. Total Orders (+/- `ordersChange`)
3. Store Rating (`averageRating`, optional `reviewCount`)
4. Products Listed (`totalProducts`)

Optional secondary KPI badges:

- `followerCount`

## 4.3 Charts

### Revenue trend

- Source: `charts.revenueByDay`
- X: `date`, Y: `revenue`

### Orders trend

- Source: `charts.ordersByDay`
- X: `date`, Y: `orders`

### Orders by status

- Source: `charts.ordersByStatus`
- Suggested status labels:
  - pending
  - confirmed
  - processing
  - shipped
  - delivered
  - fallback: raw status text

### Revenue by payment method

- Source: `charts.revenueByPaymentMethod`
- Show payment method + amount.

## 4.4 Top products

- Source: `charts.topProducts`
- Per row: `name`, `orders`, `revenue`, optional `image`
- Empty state if array is empty.

---

## 5) API helper already available (web parity)

In shared API helper:

- `sellerApi.getAnalytics(period)` -> `/api/seller/analytics?period=...`

Mobile should mirror this helper behavior.

---

## 6) Loading, empty, and error states (required)

1. **Loading:** skeleton/spinner while fetching.
2. **No data:** show empty cards/charts with zero values.
3. **Error:** toast/snackbar + retry button.
4. **Unauthorized (401/403):** route to login or seller dashboard gate flow.

---

## 7) Mobile parity checklist

A seller analytics mobile screen is parity-ready when:

1. Period switching works and triggers API refetch.
2. KPI values match web for same account + period.
3. Revenue and orders trend charts render from API arrays.
4. Top products list and status/payment breakdowns render correctly.
5. Empty/error states are handled gracefully.

---

## 8) Suggested mobile screen route

- `SellerAnalyticsScreen`
  - entry points:
    - seller tab: “Analytics”
    - quick action card from seller overview

For exact shell parity with web, keep this under seller role-protected navigation.
