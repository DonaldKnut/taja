# API Routes Summary

## ✅ Completed API Routes

### Authentication Routes
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/verify-email` - Verify email with OTP
- ✅ `POST /api/auth/send-email-verification` - Send OTP email
- ✅ `GET /api/auth/profile` - Get user profile
- ✅ `PUT /api/auth/profile` - Update user profile
- ✅ `GET /api/auth/google` - Initiate Google OAuth
- ✅ `GET /api/auth/oauth/google/callback` - Google OAuth callback

### Shop Routes
- ✅ `GET /api/shops` - Get all shops (with filters)
- ✅ `POST /api/shops` - Create shop (Seller/Admin)
- ✅ `GET /api/shops/:shopId` - Get shop by ID
- ✅ `PUT /api/shops/:shopId` - Update shop (Owner/Admin)
- ✅ `GET /api/shops/slug/:slug` - Get shop by slug
- ✅ `GET /api/shops/:shopId/products` - Get shop products

### Product Routes
- ✅ `GET /api/products` - Get all products (with filters, search, pagination)
- ✅ `POST /api/products` - Create product (Seller/Admin)
- ✅ `GET /api/products/:productId` - Get product by ID
- ✅ `PUT /api/products/:productId` - Update product (Owner/Admin)
- ✅ `DELETE /api/products/:productId` - Delete product (Owner/Admin)
- ✅ `GET /api/products/slug/:slug` - Get product by slug
- ✅ `GET /api/products/featured` - Get featured products

### Order Routes
- ✅ `GET /api/orders` - Get user orders (buyer or seller)
- ✅ `POST /api/orders` - Create order
- ✅ `GET /api/orders/:id` - Get order by ID
- ✅ `PUT /api/orders/:id/status` - Update order status (Seller/Admin)

### Cart Routes
- ✅ `GET /api/cart` - Get user cart
- ✅ `POST /api/cart` - Add to cart
- ✅ `PUT /api/cart/:itemId` - Update cart item quantity
- ✅ `DELETE /api/cart/:itemId` - Remove from cart
- ✅ `DELETE /api/cart` - Clear cart

### Category Routes
- ✅ `GET /api/categories` - Get all categories
- ✅ `POST /api/categories` - Create category (Admin)
- ✅ `GET /api/categories/:categoryId/subcategories` - Get subcategories

### Upload Routes
- ✅ `POST /api/upload` - Upload file (images to R2)

### User Management Routes
- ✅ `GET /api/users/addresses` - Get user addresses
- ✅ `POST /api/users/addresses` - Add address
- ✅ `PUT /api/users/addresses/:id` - Update address
- ✅ `DELETE /api/users/addresses/:id` - Delete address

## 🚧 Remaining Routes to Implement

### Wishlist Routes
- [ ] `GET /api/wishlist` - Get wishlist
- [ ] `POST /api/wishlist/:productId` - Add to wishlist
- [ ] `DELETE /api/wishlist/:productId` - Remove from wishlist
- [ ] `GET /api/wishlist/check/:productId` - Check if in wishlist

### Review Routes
- [ ] `POST /api/reviews/product/:productId` - Create product review
- [ ] `GET /api/reviews/product/:productId` - Get product reviews
- [ ] `POST /api/reviews/shop/:shopId` - Create shop review
- [ ] `GET /api/reviews/shop/:shopId` - Get shop reviews
- [ ] `PUT /api/reviews/:reviewId` - Update review
- [ ] `DELETE /api/reviews/:reviewId` - Delete review

### Payment Routes
- [ ] `POST /api/payments/initialize` - Initialize Flutterwave payment
- [ ] `GET /api/payments/verify/:reference` - Verify Flutterwave payment
- [ ] `POST /api/payments/paystack/initialize` - Initialize Paystack payment
- [ ] `GET /api/payments/paystack/verify/:reference` - Verify Paystack payment

### Additional User Routes
- [ ] `GET /api/users/preferences` - Get preferences
- [ ] `PUT /api/users/preferences` - Update preferences
- [ ] `POST /api/users/avatar` - Upload avatar
- [ ] `POST /api/auth/change-password` - Change password
- [ ] `POST /api/auth/forgot-password` - Request password reset
- [ ] `POST /api/auth/reset-password` - Reset password

### Additional Models Needed
- [ ] Wishlist model
- [ ] Review model
- [ ] Notification model
- [ ] Chat model
- [ ] Transaction model

## 📝 Notes

- All routes use Next.js 14 App Router format
- Authentication is handled via JWT tokens in Authorization header
- Rate limiting is applied to auth endpoints
- File uploads use Cloudflare R2
- Email service uses Resend with HTML templates
- Socket.IO is set up for real-time features








