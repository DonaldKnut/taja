# Dojah identity verification setup

Use this to verify customers with **NIN** (National ID) and **VIN** (Voter’s ID) in Nigeria.

## 1. Get your App ID and Secret Key

1. Log in at **[Dojah Dashboard](https://app.dojah.io)**.
2. Go to **Developers → Configuration → My Apps** (or **Configuration → API Keys**).
3. Create an app (or use the default one).
4. You’ll see:
   - **App ID** – use as the `AppId` header.
   - **Secret Key** (private key) – use as the `Authorization` header (paste the value as-is; the app sends it in the header).

If the keys are hidden, you may need to enter your account password to reveal or copy them.

## 2. Add keys to `.env`

Production keys:
```env
DOJAH_APP_ID=your_app_id_here
DOJAH_API_KEY=your_secret_key_here
```

For **test/sandbox keys** only, also set:
```env
DOJAH_USE_SANDBOX=true
```

- Use the **Secret Key** from the dashboard as `DOJAH_API_KEY` (the “public secret key” in the docs = your **Secret Key**).
- Do **not** commit `.env` or share the Secret Key; keep it server-side only.

## 3. Environments

| Environment | Base URL              | Use case        |
|------------|------------------------|-----------------|
| Sandbox    | `https://sandbox.dojah.io` | Testing only   |
| Production | `https://api.dojah.io`     | Live verification |

The app uses **Production** by default. To test without live charges, set `DOJAH_USE_SANDBOX=true` in `.env` so the app uses sandbox; otherwise test keys fail and the app falls back to manual. Use Dojah’s test credentials.

## 4. Test credentials (Sandbox)

- **NIN:** `70123456789`
- **VIN (Voter’s ID):** `91F6B1F5BE29535558655586`

Use these only in sandbox to confirm the integration.

## 5. What’s wired in the app

- **NIN Lookup** – `GET /api/v1/kyc/nin?nin=...` → used when a user enters their NIN (onboarding KYC, seller verification).
- **VIN Lookup** – `GET /api/v1/kyc/vin?vin=...` → used when a user chooses “Voter’s card” and enters their VIN.

Both use the same `AppId` and `Authorization` (Secret Key) from your `.env`.
