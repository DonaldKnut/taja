# Taja.Shop Enhanced Setup Guide

## Overview

This enhanced version of Taja.Shop includes:

- Cloudflare integration for image and video uploads
- Advanced product upload page with video support
- Comprehensive category system
- Enhanced marketplace with filtering
- Advanced footer and brand showcase components
- Media slider supporting both images and videos

## Environment Variables

### Backend (.env)

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/taja-shop

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_IMAGES_DELIVERY_URL=https://imagedelivery.net/your-account-id
CLOUDFLARE_STREAM_DELIVERY_URL=https://customer-xyz.cloudflarestream.com

# Cloudinary Configuration (Alternative)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Payment Gateway - Flutterwave
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_ENCRYPTION_KEY=your-flutterwave-encryption-key

# Payment Gateway - Paystack
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=TajaShop

# Delivery Partners
GOKADA_API_KEY=your-gokada-api-key
KWIK_API_KEY=your-kwik-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=104857600
ALLOWED_IMAGE_TYPES=image/jpeg,image/jpg,image/png,image/webp,image/gif
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg,video/quicktime

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLOUDFLARE_IMAGES_DELIVERY_URL=https://imagedelivery.net/your-account-id
NEXT_PUBLIC_CLOUDFLARE_STREAM_DELIVERY_URL=https://customer-xyz.cloudflarestream.com
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 3. Database Setup

```bash
# Start MongoDB
mongod

# Seed categories (optional)
cd backend
npm run seed:categories
```

### 4. Cloudflare Setup

#### Images

1. Go to Cloudflare Dashboard
2. Navigate to Images
3. Create a new Images account
4. Get your Account ID and API Token
5. Set up your delivery URL

#### Stream

1. Go to Cloudflare Dashboard
2. Navigate to Stream
3. Create a new Stream account
4. Get your Account ID and API Token
5. Set up your delivery URL

### Cloudflare Keys Guide

Follow these exact steps to obtain and configure your Cloudflare keys.

1. Create a Cloudflare API Token (scoped)

- Visit: https://dash.cloudflare.com/profile/api-tokens
- Click “Create Token” → “Create Custom Token”
- Name: TajaShop-Images-Stream
- Permissions:
  - Account → Cloudflare Images → Edit
  - Account → Stream → Edit
- Account Resources: Include → Your Account
- Continue → Create Token → Copy the token

2. Find your Account ID

- Visit: https://dash.cloudflare.com
- Click your account (top-left selector)
- Copy the Account ID displayed in the overview (or in Images/Stream pages)

3. Configure Delivery URLs

- Images: Open “Images” → “Delivery URL”
  - Copy the base like: https://imagedelivery.net/ACCOUNT_HASH
  - Put into .env as CLOUDFLARE_IMAGES_DELIVERY_URL
- Stream: Open “Stream” → “Players/Delivery”
  - Copy playback base like: https://customer-XXXX.cloudflarestream.com
  - Put into .env as CLOUDFLARE_STREAM_DELIVERY_URL

4. Update .env (backend)

Add or update the following keys:

CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-scoped-api-token
CLOUDFLARE_IMAGES_DELIVERY_URL=https://imagedelivery.net/ACCOUNT_HASH
CLOUDFLARE_STREAM_DELIVERY_URL=https://customer-XXXX.cloudflarestream.com

5. Update .env.local (frontend)

NEXT_PUBLIC_CLOUDFLARE_IMAGES_DELIVERY_URL=https://imagedelivery.net/ACCOUNT_HASH
NEXT_PUBLIC_CLOUDFLARE_STREAM_DELIVERY_URL=https://customer-XXXX.cloudflarestream.com

6. Verify integration

- Restart backend and frontend
- Test POST /api/upload/image with a small image
- Test POST /api/upload/video with a small mp4
- Confirm returned URLs load in the browser

## New Features

### 1. Advanced Product Upload

- **Location**: `/seller/products/advanced-upload`
- **Features**:
  - Step-by-step upload process
  - Image and video support
  - Advanced specifications
  - SEO optimization
  - Preview mode

### 2. Enhanced Marketplace

- **Location**: `/marketplace/enhanced`
- **Features**:
  - Comprehensive category filtering
  - Price range filtering
  - Condition filtering
  - Advanced search
  - Media slider for products

### 3. Media Slider Component

- **Location**: `@/components/ui/MediaSlider`
- **Features**:
  - Image and video support
  - Thumbnail navigation
  - Fullscreen mode
  - Play/pause controls
  - Zoom and rotation for images

### 4. Brand Showcase

- **Location**: `@/components/ui/BrandShowcase`
- **Features**:
  - Step-by-step process showcase
  - Interactive carousel
  - Testimonials
  - Statistics display

### 5. Advanced Footer

- **Location**: `@/components/ui/AdvancedFooter`
- **Features**:
  - Comprehensive link organization
  - Newsletter signup
  - Social media links
  - Contact information
  - Mobile app download links

## API Endpoints

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id/subcategories` - Get subcategories
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/slug/:slug` - Get category by slug

### Upload

- `POST /api/upload/image` - Upload single image
- `POST /api/upload/video` - Upload single video
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/media` - Upload mixed media

## Database Models

### Enhanced Product Model

```typescript
interface IProduct {
  // ... existing fields
  videos?: {
    url: string;
    thumbnail?: string;
    duration?: number;
    type: "video";
  }[];
  // ... other fields
}
```

### Category Model

```typescript
interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── cloudflare.ts          # Cloudflare configuration
│   ├── models/
│   │   ├── Product.ts             # Enhanced product model
│   │   └── Category.ts            # New category model
│   ├── routes/
│   │   ├── uploadRoutes.ts        # Enhanced upload routes
│   │   └── categoryRoutes.ts      # New category routes
│   └── scripts/
│       └── seedCategories.ts      # Category seeding script

frontend/
├── src/
│   ├── app/
│   │   ├── seller/products/advanced-upload/
│   │   │   └── page.tsx           # Advanced upload page
│   │   ├── marketplace/enhanced/
│   │   │   └── page.tsx           # Enhanced marketplace
│   │   └── api/categories/        # Category API routes
│   └── components/ui/
│       ├── MediaSlider.tsx        # Media slider component
│       ├── BrandShowcase.tsx      # Brand showcase component
│       └── AdvancedFooter.tsx     # Advanced footer component
```

## Testing

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## Deployment

### Backend

1. Set up production environment variables
2. Deploy to your preferred platform (Railway, Heroku, etc.)
3. Set up MongoDB Atlas for production database

### Frontend

1. Set up production environment variables
2. Deploy to Vercel, Netlify, or your preferred platform
3. Update API URLs for production

## Troubleshooting

### Common Issues

1. **Cloudflare Upload Errors**

   - Check API credentials
   - Verify account ID and token
   - Ensure delivery URLs are correct

2. **Category Loading Issues**

   - Run the category seeding script
   - Check database connection
   - Verify API routes are working

3. **Media Slider Not Working**
   - Check video file formats
   - Verify Cloudflare Stream setup
   - Check browser console for errors

## Support

For issues and questions:

- Check the troubleshooting section
- Review the API documentation
- Check the component documentation
- Contact the development team

## License

This project is licensed under the MIT License.
