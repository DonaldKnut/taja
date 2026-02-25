# 📊 Taja.Shop Frontend - Codebase Assessment

## 🎯 Project Overview

**Taja.Shop** is a Next.js 14 e-commerce marketplace frontend built specifically for the Nigerian market. It's designed to help sellers transition from WhatsApp-based sales to a professional online shop platform.

### Core Purpose
- **Multi-vendor marketplace** for thrift fashion, vintage items, and handmade crafts
- **Seller-focused platform** where each seller gets their own verified shop
- **Secure escrow payment system** protecting both buyers and sellers
- **Real-time communication** between buyers and sellers

---

## 🏗️ Architecture Overview

### Technology Stack

#### Frontend Framework
- **Next.js 14** with App Router (React Server Components + Client Components)
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Zustand** for client-side state management (cart)
- **React Query** for server state management
- **Framer Motion** for animations

#### Key Libraries
- **Next-Auth** - Authentication (though custom JWT implementation is used)
- **Axios** - HTTP client (though native fetch is used via custom `api` helper)
- **Socket.io Client** - Real-time chat functionality
- **React Hook Form + Zod** - Form validation
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Project Structure

```
taja_frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public routes)
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── marketplace/    # Product browsing
│   │   │   ├── login/          # Authentication
│   │   │   ├── register/
│   │   │   └── product/[slug]/ # Product detail pages
│   │   │
│   │   ├── (protected routes)
│   │   │   ├── dashboard/      # User dashboard
│   │   │   │   ├── orders/
│   │   │   │   ├── products/
│   │   │   │   ├── wishlist/
│   │   │   │   └── profile/
│   │   │   │
│   │   │   ├── seller/         # Seller dashboard
│   │   │   │   ├── dashboard/
│   │   │   │   ├── products/
│   │   │   │   └── setup/
│   │   │   │
│   │   │   └── checkout/        # Checkout flow
│   │   │
│   │   └── api/                # Next.js API routes (proxies)
│   │       └── categories/
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ImageSlider.tsx
│   │   │   ├── FloatingCart.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/               # Auth-related components
│   │   │   ├── AuthEntryModal.tsx
│   │   │   └── OAuthButtons.tsx
│   │   │
│   │   └── (other components)
│   │
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── AuthContextType.tsx
│   │
│   ├── stores/                 # Zustand stores
│   │   └── cartStore.ts        # Shopping cart state
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useMarketplaceFeed.ts
│   │   ├── useServerCartSync.ts
│   │   ├── useUserRole.ts
│   │   └── useExperiment.ts
│   │
│   ├── lib/                    # Utility functions
│   │   ├── api.ts              # API client wrapper
│   │   ├── utils.ts            # Helper functions
│   │   ├── analytics.ts        # Analytics tracking
│   │   └── seo.ts              # SEO utilities
│   │
│   ├── services/               # Service layer
│   │   └── cart.ts             # Cart operations
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # All type definitions
│   │
│   └── middleware.ts           # Next.js middleware (route protection)
│
├── public/                     # Static assets
│   ├── assets/                 # Images
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
│
├── package.json                # Dependencies
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # TailwindCSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## 🔑 Key Features & Implementation

### 1. Authentication System

**Location**: `src/contexts/AuthContext.tsx`

**How it works**:
- JWT-based authentication with tokens stored in `localStorage`
- Custom `AuthProvider` wraps the app and manages auth state
- Token auto-injection via `api.ts` helper
- Automatic token refresh and logout on 401 errors
- Role-based access control (buyer, seller, admin)

**Key Functions**:
- `login()` - Authenticates user and stores token
- `register()` - Creates new user account
- `logout()` - Clears auth state and redirects
- `refreshUser()` - Fetches latest user data from API

### 2. API Client

**Location**: `src/lib/api.ts`

**How it works**:
- Centralized API client using native `fetch`
- Automatic token injection from localStorage
- Error handling with custom `ApiError` class
- Automatic redirect to login on 401
- Development logging for debugging

**API Helpers**:
- `postsApi` - Blog/social posts functionality
- `commentsApi` - Comments on posts/products
- `shopsApi` - Shop management
- `uploadShopImage()` - Image uploads

**Base URL**: Configured to `https://tajaapp-backend.onrender.com` (production)

### 3. Shopping Cart

**Location**: `src/stores/cartStore.ts`

**How it works**:
- Zustand store with persistence to localStorage
- Stores cart items with quantity management
- Calculates totals automatically
- Floating cart UI component (`FloatingCart.tsx`)

**Key Functions**:
- `addItem()` - Adds product to cart
- `removeItem()` - Removes product
- `updateQuantity()` - Updates item quantity
- `getTotalPrice()` - Calculates cart total
- `getTotalItems()` - Counts items in cart

### 4. Route Protection

**Location**: `src/middleware.ts`

**How it works**:
- Next.js middleware intercepts requests
- Checks for authentication token in cookies
- Redirects unauthenticated users from protected routes
- Redirects authenticated users away from auth pages

**Protected Routes**:
- `/dashboard/*`
- `/checkout`
- `/seller/*`
- `/admin/*`

### 5. Marketplace Feed

**Location**: `src/hooks/useMarketplaceFeed.ts`

**Purpose**: Custom hook for fetching and managing marketplace product listings with:
- Infinite scroll/pagination
- Filtering and sorting
- Search functionality
- Loading states

### 6. Product Display

**Key Components**:
- `ImageSlider.tsx` - Multi-image product galleries
- `ProductCard` (in marketplace page) - Product listing cards
- Product detail pages with zoom, reviews, related products

### 7. Shop System

**Features**:
- Individual shop pages at `/shop/[slug]`
- Shop branding (logo, banner)
- Shop verification badges
- Shop analytics
- Product catalogs per shop

---

## 🔄 Data Flow

### Authentication Flow
```
User Login → AuthContext.login() 
  → api('/api/auth/login') 
  → Store token in localStorage 
  → Update AuthContext state 
  → Redirect to dashboard
```

### Product Browsing Flow
```
Marketplace Page → useMarketplaceFeed() 
  → api('/api/products') 
  → Display ProductCards 
  → Click product → Navigate to /product/[slug]
```

### Cart Flow
```
Add to Cart → cartStore.addItem() 
  → Update Zustand store 
  → Persist to localStorage 
  → Update FloatingCart UI
```

### Checkout Flow
```
Cart → Checkout Page 
  → Enter shipping address 
  → Payment (Flutterwave/Paystack) 
  → Create order via API 
  → Redirect to order confirmation
```

---

## 🌐 API Integration

### Backend Connection
- **Production API**: `https://tajaapp-backend.onrender.com`
- **Environment Variables**: 
  - `NEXT_PUBLIC_API_URL` - API base URL
  - `NEXT_PUBLIC_SOCKET_URL` - WebSocket URL for chat
  - `NEXTAUTH_URL` - NextAuth configuration
  - `NEXTAUTH_SECRET` - NextAuth secret

### API Endpoints Used
- `/api/auth/*` - Authentication
- `/api/products/*` - Products
- `/api/shops/*` - Shops
- `/api/orders/*` - Orders
- `/api/users/*` - User management
- `/api/posts/*` - Social posts
- `/api/comments/*` - Comments
- `/api/upload` - File uploads

---

## 🎨 UI/UX Features

### Design System
- **Primary Color**: Emerald Green (`#10B981`)
- **Secondary Color**: Amber (`#F59E0B`)
- **Fonts**: Plus Jakarta Sans (primary), Sora (variable)
- **Component Library**: Custom components with shadcn/ui patterns

### Key UI Components
- **Logo** - Brand logo component
- **Button** - Styled button with variants
- **Card** - Product/shop cards
- **ImageSlider** - Image galleries with navigation
- **FloatingCart** - Persistent shopping cart sidebar
- **AdvancedFooter** - Comprehensive footer
- **BrandShowcase** - Featured brands section

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Mobile menu with slide-in panel
- Touch-optimized interactions

---

## 🔒 Security Features

1. **JWT Token Management**
   - Tokens stored in localStorage
   - Automatic token injection in API calls
   - Token validation on protected routes

2. **Route Protection**
   - Middleware-based route guards
   - Role-based access control

3. **Input Validation**
   - React Hook Form + Zod validation
   - Type-safe API calls with TypeScript

4. **Error Handling**
   - Custom error boundaries
   - Graceful error messages
   - Network error detection

---

## 📱 PWA Features

- **Service Worker**: `public/sw.js`
- **Manifest**: `public/manifest.json`
- **PWA Registration**: `src/components/PWARegistration.tsx`
- **Offline Support**: Service worker caching

---

## 🚀 Performance Optimizations

1. **Next.js Image Optimization**
   - Automatic image optimization
   - Lazy loading
   - Responsive images

2. **Code Splitting**
   - Automatic route-based code splitting
   - Dynamic imports where needed

3. **Caching**
   - Zustand persistence
   - localStorage caching
   - API response caching (via Next.js)

---

## 🐛 Known Issues & Considerations

### Potential Issues

1. **Dual Source Directories**
   - There's both `src/` and `frontend/src/` directories
   - The main app appears to be in `src/`
   - `frontend/src/` may be legacy or unused

2. **API URL Hardcoding**
   - Production URL is hardcoded in `next.config.js`
   - Should use environment variables more consistently

3. **Token Storage**
   - Tokens in localStorage (XSS vulnerability)
   - Consider httpOnly cookies for better security

4. **Error Handling**
   - Some API calls may need better error boundaries
   - Network error handling could be more robust

---

## 📝 Development Workflow

### Running the Project
```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

---

## 🎯 Key Business Logic

### User Roles
- **Buyer**: Browse, purchase, review products
- **Seller**: Create shop, list products, manage orders
- **Admin**: Platform management, moderation

### Shop Creation Flow
1. User registers as seller
2. Creates shop with name, description, slug
3. Uploads logo and banner
4. Gets verified (optional, with NIN)
5. Can start listing products

### Order Flow
1. Add products to cart
2. Proceed to checkout
3. Enter shipping address
4. Select payment method
5. Pay via Flutterwave/Paystack (escrow)
6. Seller ships product
7. Buyer receives and confirms
8. Payment released to seller

---

## 🔮 Future Enhancements

Based on the codebase, potential improvements:
- AI-powered product recommendations
- Multi-language support (Hausa, Yoruba, Igbo)
- Video product uploads
- Live shopping features
- Advanced analytics dashboard
- Subscription services for sellers

---

## 📚 Key Files to Understand

### Essential Files
1. `src/app/layout.tsx` - Root layout with providers
2. `src/contexts/AuthContext.tsx` - Authentication logic
3. `src/lib/api.ts` - API client
4. `src/stores/cartStore.ts` - Cart state management
5. `src/middleware.ts` - Route protection
6. `src/app/page.tsx` - Homepage
7. `src/app/marketplace/page.tsx` - Product listings

### Component Files
- `src/components/ui/` - Reusable UI components
- `src/components/auth/` - Authentication components
- `src/components/Providers.tsx` - App providers wrapper

---

## 🎓 Learning Resources

To understand this codebase better:
1. **Next.js 14 App Router** - Official docs
2. **Zustand** - State management library
3. **React Query** - Server state management
4. **TypeScript** - Type safety
5. **TailwindCSS** - Utility-first CSS

---

## ✅ Summary

This is a **production-ready e-commerce marketplace frontend** with:
- ✅ Complete authentication system
- ✅ Shopping cart functionality
- ✅ Product browsing and detail pages
- ✅ Shop management for sellers
- ✅ Real-time chat integration
- ✅ Payment processing (via backend)
- ✅ Order management
- ✅ PWA capabilities
- ✅ Responsive design
- ✅ Type-safe TypeScript implementation

The codebase is well-structured, follows Next.js 14 best practices, and is ready for deployment to platforms like Vercel or Netlify.









