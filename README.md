# 🛍️ Taja.Shop - Nigeria's Trusted E-commerce Marketplace

**From WhatsApp chaos to your own shop** - A next-generation Nigerian e-commerce platform built for thrift fashion, vintage items, and handmade crafts.

## 🚀 Project Overview

Taja.Shop is a comprehensive e-commerce ecosystem designed specifically for the Nigerian market, featuring:

- **Multi-platform**: Web (Next.js), Mobile (React Native), Backend (Node.js)
- **Seller-focused**: Individual shops with verification and analytics
- **Secure payments**: Escrow system with Flutterwave/Paystack integration
- **Real-time features**: Live chat, notifications, and order tracking
- **Local delivery**: Integration with Gokada, Kwik, and other Nigerian delivery services

## 📁 Project Structure

```
Tajaapp/
├── frontend/          # Next.js 14 web application
├── backend/           # Node.js Express API server
├── mobile/            # React Native Expo mobile app
├── package.json       # Root package management
└── README.md         # This file
```

## 🛠️ Technology Stack

### Frontend (Web)

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend (API)

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer with Cloudinary integration
- **Payments**: Flutterwave & Paystack APIs

### Mobile (React Native)

- **Framework**: Expo with React Native
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Storage**: Expo SecureStore
- **Icons**: Expo Vector Icons
- **Camera**: Expo Camera & Image Picker

### Delivery Integration

- **Gokada**: Express delivery service
- **Kwik**: On-demand delivery
- **Custom tracking**: Real-time order updates

## 🎯 Key Features

### ✅ **Completed Core Features**

#### 🔐 **Authentication & Authorization**

- JWT-based authentication with refresh tokens
- Role-based access control (buyer, seller, admin)
- Secure password hashing with bcryptjs
- Protected routes and API endpoints

#### 🏪 **Shop Management**

- Seller shop creation and customization
- Product upload with image management
- Shop analytics and performance metrics
- SEO-optimized shop URLs with slugs

#### 🛒 **Marketplace & Products**

- **Interactive Product Cards**: Multi-image sliders with hover controls and smooth navigation
- **Advanced Product Detail Pages**: Comprehensive product pages with:
  - Zoomable image gallery with full-screen modal view
  - Detailed specifications and long descriptions with rich formatting
  - Customer reviews with images and helpful voting
  - Related products recommendations
  - Seller information with shop links
  - Social sharing capabilities
  - Stock status and quantity selectors
- **Shop Storefronts**: Dedicated shop pages (`/shop/[slug]`) featuring:
  - Professional shop branding with banners and logos
  - Complete product catalogs with search and filtering
  - Shop statistics and policies
  - Owner information and contact options
  - Customer reviews and ratings
  - Follow/unfollow functionality
- **Enhanced Search & Discovery**: Advanced filters, sorting, and category browsing
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

#### 💳 **Payment System (Escrow)**

- Flutterwave integration for secure payments
- Escrow system protecting both buyers and sellers
- Payment verification and webhook handling
- Transaction history and management

#### 💬 **Real-time Chat System**

- Socket.io-powered messaging between buyers and sellers
- Product-specific chat threads
- Typing indicators and read receipts
- File sharing capabilities

#### 🚚 **Delivery & Tracking**

- Integration with Nigerian delivery providers (Gokada, Kwik)
- Real-time order tracking
- Delivery cost estimation
- Webhook-based status updates

#### ✅ **Seller Verification**

- Nigerian NIN (National Identity Number) validation
- Document upload and verification
- Identity confirmation with selfie matching
- Admin panel for verification review

#### 📱 **Mobile Application**

- Cross-platform React Native app with Expo
- Native authentication and secure storage
- Product browsing and shopping cart
- Push notifications and offline support

### 🏗️ **System Architecture**

#### **Database Models**

- **User**: Authentication, profiles, verification
- **Shop**: Seller stores with branding and analytics
- **Product**: Items with images, pricing, and inventory
- **Order**: Purchase flow with status tracking
- **Chat**: Messaging system with participants
- **Transaction**: Payment and escrow management
- **Review**: Product and shop ratings
- **Notification**: Real-time user alerts

#### **API Architecture**

- RESTful API design with consistent response format
- Comprehensive error handling and validation
- Rate limiting and security middleware
- File upload management with cloud storage
- Real-time updates via WebSocket connections

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository>
cd Tajaapp

# Install root dependencies
npm install

# Setup all packages
npm run setup
```

### 2. Environment Configuration

Create `.env` files in both `frontend/` and `backend/` directories:

**Backend (.env)**:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taja-shop
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
FRONTEND_URL=http://localhost:3000

# Payment Providers
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Delivery Providers
GOKADA_API_KEY=your_gokada_api_key
KWIK_API_KEY=your_kwik_api_key

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

**Frontend (.env.local)**:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Runs on http://localhost:3000
npm run dev:backend   # Runs on http://localhost:5000
```

### 4. Mobile Development

```bash
cd mobile
npm install
npm start  # Opens Expo development server
```

## 📱 Mobile App Setup

The mobile app is built with Expo for easy development and deployment:

```bash
cd mobile
npm install

# Start development server
npm start

# Run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## 🔧 Available Scripts

```bash
# Root level
npm run setup          # Install all dependencies
npm run dev           # Start both frontend and backend
npm run dev:frontend  # Start Next.js development server
npm run dev:backend   # Start Express API server
npm run build         # Build all applications
npm run start         # Start production servers
npm run lint          # Lint all projects
npm run test          # Run all tests

# Frontend specific
cd frontend
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint check

# Backend specific
cd backend
npm run dev           # Development with nodemon
npm run build         # TypeScript compilation
npm run start         # Production server
npm run test          # Jest testing

# Mobile specific
cd mobile
npm start             # Expo development
npm run ios           # iOS simulator
npm run android       # Android emulator
```

## 🏛️ Project Architecture

### **Monorepo Structure**

- **Shared dependencies** at root level
- **Independent deployment** for each service
- **Consistent tooling** across all projects
- **Centralized configuration** and scripts

### **API Design**

- **RESTful endpoints** following OpenAPI standards
- **Consistent response format** with success/error patterns
- **Comprehensive error handling** with meaningful messages
- **Input validation** with detailed error responses

### **Security Implementation**

- **JWT authentication** with refresh token rotation
- **Password hashing** using bcryptjs with salt rounds
- **Rate limiting** to prevent abuse
- **CORS configuration** for cross-origin requests
- **Input sanitization** and validation
- **File upload security** with type and size restrictions

## 🎨 Design System

### **Brand Colors**

- **Primary**: `#10B981` (Emerald Green - trust & growth)
- **Secondary**: `#F59E0B` (Amber - energy & warmth)
- **Dark**: `#1F2937` (Dark Gray)
- **Light**: `#F9FAFB` (Light Gray)

### **UI Components**

- Consistent button styles and interactions
- Responsive card layouts for products and shops
- Loading states and skeleton screens
- Toast notifications for user feedback
- Modal dialogs for confirmations

## 🚀 Deployment

### **Frontend (Vercel)**

```bash
cd frontend
npm run build
# Deploy to Vercel
```

### **Backend (Render/Railway)**

```bash
cd backend
npm run build
# Deploy to your preferred hosting service
```

### **Mobile (Expo)**

```bash
cd mobile
expo build:ios     # iOS App Store
expo build:android # Google Play Store
```

## 📊 Current Status

✅ **Project Setup** - Monorepo with Next.js, Node.js, React Native
✅ **Database Models** - Complete MongoDB schemas with Mongoose
✅ **Authentication System** - JWT-based auth with role management  
✅ **Seller Features** - Shop creation, product management, dashboard
✅ **Advanced Marketplace** - Interactive product cards with image sliders
✅ **Product Detail Pages** - Comprehensive product pages with galleries and reviews
✅ **Shop Storefronts** - Professional shop pages with branding and catalogs
✅ **Payment Integration** - Flutterwave/Paystack escrow system
✅ **Chat System** - Real-time messaging with Socket.io
✅ **Delivery Tracking** - Nigerian delivery provider integration
✅ **Verification System** - NIN validation and document verification
✅ **Mobile Application** - React Native app with Expo
✅ **Review System** - Product and shop reviews with ratings
✅ **Wishlist Features** - Save and manage favorite products
✅ **Notification System** - In-app and push notifications
✅ **Advanced Analytics** - Seller dashboard with comprehensive insights
✅ **Coupon System** - Discount codes and promotional features

## 🔮 Future Enhancements

- **AI Integration**: Smart product recommendations and personalization
- **Multi-language**: Support for local Nigerian languages (Hausa, Yoruba, Igbo)
- **Advanced Mobile Features**: Enhanced offline mode and native camera integration
- **Video Content**: Product video uploads and streaming capabilities
- **Live Shopping**: Real-time product demonstrations and sales
- **Social Commerce**: Social media integration and sharing features
- **Advanced Search**: AI-powered search with visual similarity
- **Subscription Services**: Premium seller features and analytics
- **B2B Marketplace**: Wholesale and bulk purchasing options
- **Cryptocurrency**: Digital payment options and wallet integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for the Nigerian e-commerce market.

## 🙏 Acknowledgments

- **Next.js team** for the amazing React framework
- **MongoDB team** for the flexible database solution
- **Expo team** for simplifying React Native development
- **Nigerian developer community** for inspiration and feedback

---

**Built with ❤️ for Nigerian entrepreneurs and shoppers**

_Taja.Shop - Empowering every Nigerian to have their own online store_
