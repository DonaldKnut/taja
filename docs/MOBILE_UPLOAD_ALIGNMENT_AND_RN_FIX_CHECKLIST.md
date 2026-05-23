# Mobile Add Product Alignment Gaps + RN Upload Fix Checklist

Use this as the implementation checklist for mobile to fix `upload stage` network failures and ensure backend contract parity.

---

## 1) What is not fully aligned (must fix)

## A) `processingTime` enum mismatch

Backend currently accepts only:

- `1-2-days`
- `3-5-days`
- `1-week`
- `2-weeks`

If mobile sends values like:

- `same-day`
- `1-2-weeks`
- `2-4-weeks`

product create can fail with validation errors.

**Action:** map mobile UI presets to the backend enum above.

---

## B) Upload failure type being seen

Current mobile error pattern:

- stage: `upload`
- error: `Network Error`
- status: none

This usually means request failed **before** the API returned JSON (transport/multipart problem), not business validation from `POST /api/products`.

---

## 2) Most likely causes in React Native

1. FormData file part malformed (`uri` / `name` / `type` missing or invalid URI).
2. Manually setting `Content-Type: multipart/form-data` (this breaks boundary handling in RN).
3. Very large image or weak network causes request drop before response.
4. TLS/network path issue from device/emulator to `https://tajaapp.shop`.
5. Axios RN multipart issue (common `Network Error` when file object is malformed).

---

## 3) Critical rule (most important)

## **DO NOT manually set `Content-Type` for multipart uploads in RN**

Let `fetch`/RN set the multipart boundary automatically.

If you force `Content-Type: multipart/form-data`, RN often sends an invalid request body boundary and backend never receives a valid file part.

This is the #1 thing to fix first.

---

## 4) Safe RN upload pattern (copy this)

```ts
async function uploadProductImage({
  apiHost,
  token,
  imageUri,
}: {
  apiHost: string; // e.g. https://tajaapp.shop
  token: string;
  imageUri: string; // file://... or content://...
}) {
  const formData = new FormData();

  formData.append("type", "product");
  formData.append(
    "file",
    {
      uri: imageUri,
      name: "product-image.jpg",
      type: "image/jpeg",
    } as any
  );

  const res = await fetch(`${apiHost}/api/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANT: DO NOT set Content-Type manually
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Upload failed (${res.status})`);
  }

  // Backend returns data.url
  return data?.data?.url || data?.data;
}
```

---

## 5) Quick diagnostics checklist

Run in this order:

1. Upload a tiny JPG (`< 1MB`) to reduce timeout/noise.
2. Log file object before upload:
   - `uri`
   - `name`
   - `type`
   - file size if available
3. Confirm URI format is valid (`file://` or `content://`).
4. Ensure no global HTTP interceptor is injecting multipart `Content-Type`.
5. Test same token + same endpoint in Postman:
   - If Postman works and RN fails -> RN multipart assembly issue.
6. Test on physical device and emulator:
   - emulator networking/TLS issues can differ.
7. Retry with `fetch` if currently using Axios for multipart.

---

## 6) Backend contract reminder for add product

`POST /api/products` requires:

- `title`
- `description`
- `category`
- `price`
- `images` (non-empty array)

Recommended mobile payload:

- Send `category` as category `_id` from `GET /api/seller/categories`.
- Keep `variants` as `[]` when none.
- `seo` can be sent with empty defaults.
- `costPerKg` should be omitted (or null-safe mapped) when not used.

---

## 7) Immediate action items for mobile team

1. Remove manual multipart `Content-Type` from upload call.
2. Enforce safe file object shape `{ uri, name, type }`.
3. Add upload debug log with stage + URL + file metadata.
4. Restrict `processingTime` options to backend-supported enum.
5. Retry product create only after all image uploads return valid URLs.

