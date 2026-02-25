# Give a user “verified seller” rights in MongoDB Compass

Use this when you want to treat a user as **registered and verified as a seller** (e.g. for testing) without going through onboarding/KYC in the app.

## 1. Open the user document

1. Open **MongoDB Compass** and connect to your database.
2. Select the database (e.g. the one in your `MONGODB_URI`).
3. Open the **users** collection.
4. Find your user (e.g. filter by `{ "email": "your@email.com" }`), then click the document to open it.

## 2. Edit the document

Click **Edit Document** (pencil icon) and set the following. You can add or change fields; leave other fields as they are.

### Top-level fields

| Field             | Type    | Value        | Notes |
|-------------------|--------|--------------|--------|
| `role`            | string | `"seller"`   | Required for seller routes. |
| `roleSelected`    | boolean| `true`       | So onboarding skips role-selection. |
| `roleSelectionDate` | date | current date | e.g. `new Date()` or today’s ISO date. |
| `accountStatus`   | string | `"active"`   | Required for login and seller access. |

### KYC (nested under `kyc`)

If there is no `kyc` object, add one. Set at least:

| Field (under `kyc`) | Type   | Value        | Notes |
|---------------------|--------|--------------|--------|
| `kyc.status`         | string | `"approved"` | Treated as verified seller. |
| `kyc.submittedAt`   | date   | (optional)   | e.g. `new Date()`. |

Optional but useful:

- `kyc.identityVerified`: `true`
- `kyc.businessName`: any string (e.g. `"Test Shop"`).

## 3. Example shape

After editing, the document should look roughly like this (other fields unchanged):

```json
{
  "role": "seller",
  "roleSelected": true,
  "roleSelectionDate": { "$date": "2025-02-20T12:00:00.000Z" },
  "accountStatus": "active",
  "kyc": {
    "status": "approved",
    "submittedAt": { "$date": "2025-02-20T12:00:00.000Z" },
    "identityVerified": true,
    "businessName": "Test Shop"
  }
}
```

In Compass you edit in the UI; dates are often shown as `{ "$date": "..." }` or you can use **Insert Field** and set type to Date.

## 4. Save and test

1. Click **Update** / **Save** in Compass.
2. In the app: **log out and log back in** (or refresh and let the app refetch the user) so the new `role` and `kyc.status` are used.
3. You should be able to open seller routes (e.g. `/seller/dashboard`) and be treated as a verified seller.

## 5. Optional: create a shop (for adding products)

To create products, the app also expects a **shop** for that user:

1. Open the **shops** collection.
2. Insert a new document with at least:
   - `owner`: your user’s `_id` (ObjectId).
   - `shopName`: e.g. `"My Test Shop"`.
   - `slug`: e.g. `"my-test-shop"`.
   - `status`: `"approved"` (so it’s not “pending”).

Example (adjust `owner` to your user’s `_id`):

```json
{
  "owner": { "$oid": "YOUR_USER_OBJECTID_HERE" },
  "shopName": "My Test Shop",
  "slug": "my-test-shop",
  "status": "approved"
}
```

After that, “Add product” and other shop-dependent seller features should work.
