# 🚀 Quick Start Guide - Taja.Shop

## ✅ What's Already Done

1. **Backend `.env` File** ✅

   - MongoDB connection configured
   - JWT secrets generated (secure 128-char keys)
   - All environment variables set up

2. **Security Features** ✅
   - Password requirements (8+ chars, uppercase, lowercase, number, special char)
   - Fraud detection system
   - Escrow payment protection
   - Seller performance monitoring

## 📋 Next Steps to Get Running

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Test Database Connection

```bash
npm run dev
```

Should see:

```
✅ MongoDB connected: tajaapp.bsoayfk.mongodb.net
📊 Database: tajaapp_db
🚀 Taja.Shop API server running on port 5000
```

### 3. Create Frontend `.env.local` File

Create `/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_another_random_secret_here
```

Then install frontend dependencies:

```bash
cd ../frontend
npm install
npm run dev
```

## ⚠️ Optional (Can Wait Until You Have Domain)

### SMS Verification (Termii)

- **Issue**: Termii requires work email for registration
- **Solution**: Use personal Gmail for now, or wait until you have `@taja.shop` email
- **Current Status**: Code ready, will log to console until API key added
- **Impact**: Users won't get SMS OTP, but can still verify via email

### Email Verification (SMTP)

- **Ready to use**: You can use Gmail for now with App Password
- **To enable**:
  1. Go to Google Account → Security
  2. Enable 2FA
  3. Generate App Password
  4. Add to `.env`:
     ```
     SMTP_USER=your_gmail@gmail.com
     SMTP_PASSWORD=your_16_char_app_password
     ```

### Payment Providers

- **Flutterwave**: Required for escrow payments (critical for buyer protection)
- **Paystack**: Optional alternative
- **Get keys**: https://dashboard.flutterwave.com

### Image Upload (Cloudinary)

- **Required for**: Product images, shop logos, user avatars
- **Get free account**: https://cloudinary.com (free tier available)
- **Impact**: App works without it, but can't upload images

## 🎯 Priority Order

### Must Have (App Won't Work Without):

1. ✅ MongoDB connection - **DONE**
2. ✅ JWT secrets - **DONE**
3. ⚠️ Install dependencies - **DO THIS NEXT**
4. ⚠️ Flutterwave keys (for payments)

### Should Have (Core Features):

5. Cloudinary (for images)
6. SMTP email (for verification)
7. Termii SMS (for phone verification - wait for domain)

### Nice to Have:

8. Delivery providers (Gokada/Kwik)
9. Push notifications (VAPID keys)

## 🧪 Test Your Setup

### 1. Test Backend Health

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "OK",
  "message": "Taja.Shop API is running",
  "timestamp": "2024-10-28T...",
  "environment": "development"
}
```

### 2. Test Database Connection

```bash
# Should connect without errors
cd backend
npm run dev
```

### 3. Register Test User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "2348123456789",
    "password": "TestPass123!",
    "role": "buyer"
  }'
```

## 📝 What About Termii?

Since Termii needs a work email:

**Option 1: Wait for Domain** (Recommended)

- Get `@taja.shop` email once domain is purchased
- Register Termii account with work email
- Add API key to `.env`

**Option 2: Use Alternative SMS Provider**

- **AWS SNS**: Accepts personal email, works in Nigeria
- **Twilio**: Global provider, more expensive
- **BulkSMS Nigeria**: Local provider, may accept personal email

**Option 3: Skip SMS for Now**

- Use email verification only
- Add SMS later when domain is ready
- Users can verify with email link

## 🎉 You're Almost Ready!

**Current Status:**

- ✅ Backend config: **READY**
- ✅ Database: **CONNECTED**
- ✅ Security: **IMPLEMENTED**
- ⚠️ Dependencies: **NEED TO INSTALL**
- ⚠️ Frontend env: **NEEDS CREATION**

**After installing dependencies, your app should start! 🚀**
















