# Mobile Blueprint: User Profile + Settings (Web Parity)

This document maps current web **Profile** and **Settings** behavior to backend endpoints so mobile can implement the same working UX.

Scope:

1. Profile screen parity
2. Settings screen parity
3. Endpoint contracts + payloads
4. Known backend/frontend gaps and recommended mobile handling

---

## 1) Web references (source of truth)

- Profile UI: `src/app/dashboard/profile/page.tsx`
- Settings UI: `src/app/dashboard/settings/page.tsx`
- Seller profile/settings reuse these same pages:
  - `src/app/seller/profile/page.tsx`
  - `src/app/seller/settings/page.tsx`

So one mobile implementation can serve both buyer and seller shells.

---

## 2) Endpoint map (what profile/settings consume)

## Core profile

### `GET /api/users/me`

Used to load:

- fullName, email, phone
- avatar, coverPhoto
- role, accountStatus
- preferences (if present)

### `PUT /api/users/me`

Used to update:

- `fullName`
- `phone`
- `avatar`
- `coverPhoto`
- `preferences`
- `role` (buyer/seller when needed)

Payload example:

```json
{
  "fullName": "Jane Doe",
  "phone": "+2348012345678",
  "avatar": "https://...",
  "coverPhoto": "https://...",
  "preferences": {
    "notifications": {
      "email": true,
      "push": true,
      "orders": true
    }
  }
}
```

### `DELETE /api/users/me`

Account deletion (soft-delete style backend behavior).

---

## Avatar and image upload flow

### `POST /api/upload`

`multipart/form-data`:

- `file`: image file
- `type`: `avatar` (profile photo) or `cover` (cover photo)

Returns URL in `data.url`.

### `POST /api/users/avatar`

Persist avatar URL to profile.

Body:

```json
{ "avatarUrl": "https://..." }
```

### `DELETE /api/users/avatar`

Remove profile avatar.

---

## Password/security

### `PUT /api/users/password`

Two modes:

1. **Regular account**: requires `currentPassword` + `newPassword`
2. **OAuth-only account**: backend allows creating password with only `newPassword`

Payload examples:

```json
{ "currentPassword": "old123", "newPassword": "newStrongPass123" }
```

or

```json
{ "newPassword": "newStrongPass123" }
```

---

## Addresses (shown in profile summary + dedicated address screen)

### `GET /api/users/addresses`
### `POST /api/users/addresses`
### `PUT /api/users/addresses/:id`
### `DELETE /api/users/addresses/:id`

Notes:

- Backend accepts both `addressLine1/addressLine2` and compatibility aliases `line1/line2`.
- Use the `:id` routes for clean CRUD on mobile.

---

## Data export (profile utility action)

### `GET /api/users/export`

Returns profile + order/cart export payload (JSON), with attachment-like headers.

Mobile can:

- save/share JSON file
- or just render “export successful” and hand off to file system/share sheet

---

## 3) UI parity requirements for mobile

## Profile screen (mobile)

Implement these blocks:

1. **Header**
   - Account title and status
   - Edit mode toggle
2. **Cover photo**
   - upload/remove
3. **Avatar**
   - upload/remove
4. **Personal fields**
   - fullName (editable)
   - email (read-only)
   - phone (editable)
   - occupation/job (optional if you preserve current web behavior)
5. **Address summary card**
   - navigate to Addresses screen
6. **Utilities**
   - export data
   - delete account

## Settings screen (mobile)

Implement these blocks:

1. **Profile quick update**
   - fullName
   - phone
   - avatar actions
2. **Password**
   - regular flow and OAuth flow
3. **Notification preferences**
   - email
   - push
   - orders
4. **Danger zone**
   - account deletion

---

## 4) Important mismatch to handle now

Web settings page calls:

- `PUT /api/users/notifications`

But there is currently **no `api/users/notifications` route** in the backend routes list.

### Mobile-safe approach

Until backend adds that endpoint, save notification settings via:

- `PUT /api/users/me` with `preferences.notifications`.

Example:

```json
{
  "preferences": {
    "notifications": {
      "email": true,
      "push": false,
      "orders": true
    }
  }
}
```

---

## 5) Mobile flow sequence (recommended)

1. On screen open -> `GET /api/users/me`
2. In parallel -> `GET /api/users/addresses` (if profile screen shows location snapshot)
3. On avatar/cover change:
   - `POST /api/upload`
   - then `POST /api/users/avatar` (avatar) or `PUT /api/users/me` for `coverPhoto`
4. On save profile -> `PUT /api/users/me`
5. On save password -> `PUT /api/users/password`
6. On save notifications -> `PUT /api/users/me` (`preferences.notifications`) until dedicated endpoint exists
7. On delete -> `DELETE /api/users/me`

---

## 6) Validation checklist for mobile

- fullName: min 2 chars
- phone: sane length/format
- password: min 6 chars, confirmation must match
- upload type: image-only; enforce client size limits before upload
- avatar upload state should disable duplicate submits

---

## 7) Success criteria (parity-ready)

Profile/settings parity is complete when mobile can:

1. Load and edit user identity (`GET/PUT /api/users/me`)
2. Upload/remove avatar (upload + avatar endpoints)
3. Manage password with both regular and OAuth account paths
4. Save notification preferences reliably via supported backend contract
5. Navigate to and manage addresses
6. Export user data and delete account

