# MongoDB: Make a user a verified seller

Use this when you want to give a user full seller rights (including “verified”) by editing the document in **MongoDB Compass** (or any MongoDB client).

## 1. Find the user

- Open the **users** collection.
- Find the user by **email** or **\_id** (e.g. filter: `{ "email": "your@email.com" }`).

## 2. Edit the document

Click **Edit** (pencil) on that document and set the following. You can do it in one edit.

### Required fields for “registered + verified seller”

| Field | Type | Value |
|--------|------|--------|
| `role` | String | `"seller"` |
| `roleSelected` | Boolean | `true` |
| `roleSelectionDate` | Date | `new Date()` or current ISO date |
| `accountStatus` | String | `"active"` |
| `kyc.status` | String | `"approved"` |

### Optional but recommended (so KYC looks complete)

| Field | Type | Value |
|--------|------|--------|
| `kyc.submittedAt` | Date | e.g. `new Date()` or an ISO date |
| `kyc.reviewedAt` | Date | e.g. `new Date()` (when “approved”) |
| `kyc.businessName` | String | e.g. `"My Shop"` |
| `kyc.idType` | String | e.g. `"national_id"` |
| `kyc.idNumber` | String | (optional) |
| `kyc.bankName` | String | (optional) |
| `kyc.accountNumber` | String | (optional) |
| `kyc.accountName` | String | (optional) |

If `kyc` doesn’t exist yet, add an object that includes at least `status: "approved"`.

## 3. Example document (relevant parts)

Before (buyer, not verified):

```json
{
  "role": "buyer",
  "roleSelected": false,
  "accountStatus": "active",
  "kyc": { "status": "not_started" }
}
```

After (verified seller):

```json
{
  "role": "seller",
  "roleSelected": true,
  "roleSelectionDate": { "$date": "2025-02-20T12:00:00.000Z" },
  "accountStatus": "active",
  "kyc": {
    "status": "approved",
    "submittedAt": { "$date": "2025-02-20T11:00:00.000Z" },
    "reviewedAt": { "$date": "2025-02-20T12:00:00.000Z" },
    "businessName": "My Shop"
  }
}
```

In Compass you can edit in the JSON view; use the same field names and types (String, Boolean, Date).

## 4. Save and test

- **Save** the document in Compass.
- Log out in the app (or clear token), then log in again so the app reloads your user.
- You should be treated as a **verified seller**: no onboarding/kyc form, access to seller dashboard and seller-only APIs.

## Summary of what the app checks

- **Skip onboarding (name/phone):** `phone` is set and, for seller, `roleSelected` and `role` are set.
- **Skip role-selection:** `roleSelected === true` and `role` is set.
- **Skip KYC form / redirect to seller dashboard:** `kyc.status === "approved"`.
- **Seller area access:** `role === "seller"` (and not banned/suspended).
- **No “under review” restrictions:** `accountStatus === "active"` (and `kyc.status === "approved"` where applicable).
