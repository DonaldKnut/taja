# Fullstack Next.js Migration Guide

## ✅ Completed

### 1. Database Setup
- ✅ MongoDB connection utility (`src/lib/db.ts`)
- ✅ Mongoose models:
  - User (`src/models/User.ts`)
  - Shop (`src/models/Shop.ts`)
  - Product (`src/models/Product.ts`)
  - Category (`src/models/Category.ts`)
  - Order (`src/models/Order.ts`)
  - Cart (`src/models/Cart.ts`)

### 2. Authentication & Security
- ✅ JWT utilities (`src/lib/auth.ts`)
  - Password hashing (bcrypt)
  - Token generation & verification
  - OTP generation
- ✅ Authentication middleware (`src/lib/middleware.ts`)
- ✅ Rate limiting (`src/lib/rateLimit.ts`)

### 3. API Routes Implemented
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/verify-email` - Email verification
- ✅ `POST /api/auth/send-email-verification` - Send OTP email
- ✅ `GET /api/auth/profile` - Get user profile
- ✅ `PUT /api/auth/profile` - Update user profile

## 🚧 In Progress / TODO

### 4. Authentication Routes (Remaining)
- [ ] `GET /api/auth/google` - Google OAuth initiation
- [ ] `GET /api/auth/oauth/google/callback` - Google OAuth callback
- [ ] `POST /api/auth/oauth/google/verify` - Verify Google ID token
- [ ] `POST /api/auth/change-password` - Change password
- [ ] `POST /api/auth/forgot-password` - Request password reset
- [ ] `POST /api/auth/reset-password` - Reset password with token
- [ ] `POST /api/auth/send-phone-otp` - Send phone OTP
- [ ] `POST /api/auth/verify-phone` - Verify phone number

### 5. User Management Routes
- [ ] `GET /api/users/addresses` - Get user addresses
- [ ] `POST /api/users/addresses` - Add address
- [ ] `PUT /api/users/addresses/:id` - Update address
- [ ] `DELETE /api/users/addresses/:id` - Delete address
- [ ] `GET /api/users/preferences` - Get preferences
- [ ] `PUT /api/users/preferences` - Update preferences
- [ ] `POST /api/users/avatar` - Upload avatar
- [ ] `DELETE /api/users/account` - Delete account
- [ ] `POST /api/users/two-factor/enable` - Enable 2FA
- [ ] `POST /api/users/two-factor/disable` - Disable 2FA
- [ ] `POST /api/users/two-factor/verify` - Verify 2FA
- [ ] `GET /api/users/security-logs` - Get security logs

### 6. Shop Management Routes
- [ ] `POST /api/shops` - Create shop
- [ ] `GET /api/shops` - Get all shops
- [ ] `GET /api/shops/:shopId` - Get shop by ID
- [ ] `GET /api/shops/slug/:slug` - Get shop by slug
- [ ] `PUT /api/shops/:shopId` - Update shop
- [ ] `GET /api/shops/:shopId/products` - Get shop products
- [ ] `GET /api/shops/:shopId/reviews` - Get shop reviews
- [ ] `GET /api/shops/:shopId/analytics` - Get shop analytics

### 7. Product Management Routes
- [ ] `POST /api/products` - Create product
- [ ] `GET /api/products` - Get all products (with filters)
- [ ] `GET /api/products/featured` - Get featured products
- [ ] `GET /api/products/:productId` - Get product by ID
- [ ] `GET /api/products/slug/:slug` - Get product by slug
- [ ] `PUT /api/products/:productId` - Update product
- [ ] `DELETE /api/products/:productId` - Delete product

### 8. Order Management Routes
- [ ] `POST /api/orders` - Create order
- [ ] `GET /api/orders` - Get user orders
- [ ] `GET /api/orders/:id` - Get order by ID
- [ ] `PUT /api/orders/:id/status` - Update order status
- [ ] `POST /api/orders/:id/cancel` - Cancel order
- [ ] `GET /api/orders/seller-orders` - Get seller orders

### 9. Cart Routes
- [ ] `GET /api/cart` - Get cart
- [ ] `POST /api/cart` - Add to cart
- [ ] `PUT /api/cart/:itemId` - Update cart item
- [ ] `DELETE /api/cart/:itemId` - Remove from cart
- [ ] `DELETE /api/cart` - Clear cart
- [ ] `POST /api/cart/apply-coupon` - Apply coupon

### 10. Payment Routes
- [ ] `POST /api/payments/initialize` - Initialize Flutterwave payment
- [ ] `GET /api/payments/verify/:reference` - Verify Flutterwave payment
- [ ] `POST /api/payments/paystack/initialize` - Initialize Paystack payment
- [ ] `GET /api/payments/paystack/verify/:reference` - Verify Paystack payment
- [ ] `POST /api/payments/bank-transfer/submit` - Submit bank transfer proof
- [ ] `POST /api/payments/bank-transfer/:orderId/review` - Review bank transfer
- [ ] `POST /api/payments/cod/request` - Request COD
- [ ] `POST /api/payments/cod/confirm` - Confirm COD
- [ ] `GET /api/payments/transactions` - Get transactions

### 11. Additional Models Needed
- [ ] Review model
- [ ] Wishlist model
- [ ] Notification model
- [ ] Chat model
- [ ] Transaction model
- [ ] Coupon model
- [ ] Post model (for social feed)
- [ ] Comment model

### 12. File Upload
- [ ] `POST /api/upload/product-images` - Upload product images
- [ ] `POST /api/upload/shop-media` - Upload shop logo/banner
- [ ] `POST /api/upload/avatar` - Upload avatar
- [ ] `POST /api/upload/general` - Upload general files
- [ ] Integrate Cloudflare R2 or Cloudinary

### 13. Real-time Features
- [ ] Socket.IO server setup
- [ ] Chat real-time messaging
- [ ] Order tracking updates
- [ ] Notification push system

### 14. Frontend Updates
- [ ] Update `src/lib/api.ts` to use internal routes (`/api/...`) instead of external backend
- [ ] Remove `NEXT_PUBLIC_API_URL` dependency
- [ ] Update all API calls to use relative paths

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

### 3. Database Setup
- **Local MongoDB**: Install and run MongoDB locally
- **MongoDB Atlas**: Create a free cluster and get connection string

### 4. Run Development Server
```bash
npm run dev
```

## 🔄 Migration Strategy

### Phase 1: Core Authentication ✅
- Database connection
- User model & auth routes
- JWT authentication

### Phase 2: User & Shop Management (Next)
- Complete user management routes
- Shop creation & management
- File uploads

### Phase 3: Products & Orders
- Product CRUD operations
- Order management
- Cart functionality

### Phase 4: Payments & Advanced Features
- Payment gateway integration
- Reviews & ratings
- Real-time features

### Phase 5: Frontend Integration
- Update API client
- Remove external backend dependency
- Test all flows

## 📝 Notes

- All API routes follow Next.js 14 App Router conventions
- Authentication uses JWT tokens stored in Authorization header
- Rate limiting is implemented for security
- Database models use Mongoose with TypeScript
- Error handling follows consistent format: `{ success: boolean, message: string, data?: any }`

## 🚀 Next Steps

1. Complete remaining authentication routes (OAuth, password reset)
2. Implement shop management routes
3. Implement product management routes
4. Set up file upload handling
5. Update frontend to use internal API routes








