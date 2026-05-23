# Identity Verification Setup Guide

This guide explains how to set up digital identity verification for Nigerian identity documents (NIN, Passport, Voter's Card, Driver's License) and phone numbers.

## Overview

The system integrates with **Dojah API** (https://dojah.io) to verify Nigerian identity documents against government databases in real-time.

### Supported Documents

- ✅ **NIN (National Identification Number)** - 11-digit number
- ✅ **International Passport** - Format: A12345678
- ✅ **Voter's Card** - Alphanumeric
- ✅ **Driver's License** - Various formats
- ✅ **Phone Number** - Nigerian phone numbers (via NIN lookup)

## Setup Instructions

### 1. Get Dojah API Credentials

1. Sign up at https://dojah.io
2. Navigate to your dashboard
3. Get your **API Key** and **App ID**

### 2. Add Environment Variables

Add these to your `.env` file:

```env
# Identity Verification (Dojah)
DOJAH_API_KEY=your_dojah_api_key_here
DOJAH_APP_ID=your_dojah_app_id_here

# Optional: Enable/disable identity verification
ENABLE_IDENTITY_VERIFICATION=true
```

### 3. Alternative Providers

If you prefer a different provider, you can modify `src/lib/identityVerification.ts`:

#### Option A: QoreID
- Website: https://qoreid.com
- Similar API structure
- Supports same documents

#### Option B: KhadVerify
- Website: https://khadverify.com.ng
- Nigerian-focused service
- Good for NIN verification

#### Option C: GoXiD
- Website: https://goxid.com
- Bank-grade security
- Real-time verification

## How It Works

### 1. User Submits KYC

When a seller submits KYC information:
1. User enters ID type and ID number
2. System automatically verifies against government database
3. Verification result is stored with KYC submission
4. Admin can see verification status when reviewing

### 2. Real-Time Verification

Users can verify their identity before submitting:
1. Enter ID number in KYC form
2. Click "Verify" button
3. System checks against government database
4. Shows success/error message
5. Verified submissions are prioritized for admin review

### 3. API Endpoints

#### Verify Identity Document
```typescript
POST /api/verify/identity
{
  "idType": "nin" | "passport" | "voters_card" | "drivers_license",
  "idNumber": "12345678901",
  "firstName": "John", // Optional
  "lastName": "Doe",   // Optional
  "dateOfBirth": "1990-01-01" // Optional
}

Response:
{
  "success": true,
  "verified": true,
  "data": {
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "gender": "Male",
    "phoneNumber": "08012345678"
  },
  "provider": "dojah"
}
```

#### Verify Phone Number
```typescript
PUT /api/verify/phone
{
  "phoneNumber": "08012345678",
  "nin": "12345678901" // Optional, for cross-verification
}
```

## Features

### ✅ Automatic Verification
- KYC submissions are automatically verified
- Results stored in user's KYC record
- Admins see verification status

### ✅ Real-Time Verification
- Users can verify before submitting
- Instant feedback
- Reduces manual review workload

### ✅ Fallback Handling
- If verification service is down, submission still accepted
- Marked for manual review
- No blocking of legitimate users

### ✅ Development Mode
- Mock verification in development
- No API calls needed for testing
- Real verification in production

## Admin Dashboard

Admins can see:
- ✅ Verification status for each KYC submission
- ✅ Verification data (name, DOB, etc.)
- ✅ Verification errors (if any)
- ✅ Verification provider used

## Cost Considerations

### Dojah Pricing (Approximate)
- NIN Verification: ~₦50-100 per verification
- Passport Verification: ~₦100-200 per verification
- Voter's Card: ~₦50-100 per verification
- Phone Verification: ~₦20-50 per verification

**Note:** Prices vary by provider. Check current pricing on provider websites.

## Security & Privacy

- ✅ API keys stored in environment variables
- ✅ Verification data encrypted in database
- ✅ No sensitive data logged
- ✅ Compliant with Nigerian data protection regulations

## Testing

### Development Mode
In development, the system uses mock verification:
- Always returns success
- No API calls made
- Good for testing UI/UX

### Production Mode
- Real API calls to Dojah
- Actual verification against government databases
- Costs apply per verification

## Troubleshooting

### "Identity verification service not configured"
- Add `DOJAH_API_KEY` and `DOJAH_APP_ID` to `.env`
- Restart your development server

### "Verification failed"
- Check API key is valid
- Ensure sufficient API credits
- Verify ID number format is correct
- Check Dojah dashboard for errors

### "NIN verification portal down"
- This is a known issue with NIMC
- System falls back to manual review
- Users can still submit KYC

## Next Steps

1. ✅ Sign up for Dojah account
2. ✅ Add API credentials to `.env`
3. ✅ Test verification in development
4. ✅ Deploy to production
5. ✅ Monitor verification success rates
6. ✅ Adjust verification requirements as needed

## Support

For issues with:
- **Dojah API**: Contact Dojah support
- **Integration**: Check `src/lib/identityVerification.ts`
- **KYC Flow**: Check `src/app/onboarding/kyc/page.tsx`






