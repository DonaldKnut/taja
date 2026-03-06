// User Types
export type UserRole = "buyer" | "seller" | "admin";

export type AccountStatus = "active" | "suspended" | "banned" | "under_review";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  job?: string;
  accountStatus?: AccountStatus;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  roleSelected?: boolean;
  createdAt?: string;
  updatedAt?: string;
  shop?: string; // Shop ID if seller
  kyc?: {
    status?: 'pending' | 'approved' | 'rejected' | 'not_started';
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
    businessName?: string;
    businessType?: 'individual' | 'registered_business' | 'cooperative';
    businessRegistrationNumber?: string;
    taxId?: string;
    idType?: 'national_id' | 'drivers_license' | 'passport' | 'voters_card';
    idNumber?: string;
    idFrontImage?: string;
    idBackImage?: string;
    selfieImage?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    bankVerificationNumber?: string;
    businessAddress?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    utilityBill?: string;
    businessLicense?: string;
    phoneVerifiedForKyc?: boolean;
    phoneVerificationCode?: string;
    phoneVerificationExpiry?: string;
    identityVerified?: boolean;
    identityVerificationData?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      dateOfBirth?: string;
      gender?: string;
      phoneNumber?: string;
      address?: string;
      photo?: string;
    };
    identityVerificationError?: string;
    identityVerificationProvider?: string;
  };
}

// Product Types
export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  maxPrice?: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  condition: "new" | "like-new" | "good" | "fair";
  stock: number;
  moq?: number;
  seller: string | User;
  shop?: string | Shop;
  shopSlug?: string;
  location?: string;
  tags?: string[];
  inventory?: {
    quantity: number;
    moq: number;
    trackQuantity?: boolean;
  };
  specifications?: Record<string, string>;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Shop Types
export interface Shop {
  _id: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  owner: string | User;
  categories?: string[];
  isVerified?: boolean;
  averageRating?: number;
  reviewCount?: number;
  followerCount?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Order Types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderItem {
  product: string | Product;
  quantity: number;
  price: number;
  title: string;
  image?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  total: number;
  shippingAddress: Address;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  escrowReference?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Address Types
export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
}

// Cart Types
export interface CartItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  images: string[];
  seller: string;
  shopSlug?: string;
  moq: number;
  stock: number;
}

// Review Types
export interface Review {
  _id: string;
  user: string | User;
  product?: string | Product;
  shop?: string | Shop;
  rating: number;
  comment: string;
  images?: string[];
  helpfulCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth Types
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Chat Types
export interface ChatMessage {
  _id: string;
  chat: string;
  sender: string | User;
  content: string;
  images?: string[];
  read: boolean;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: (string | User)[];
  product?: string | Product;
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  unreadCount: Record<string, number>;
}

// Notification Types
export type NotificationType =
  | "order"
  | "message"
  | "review"
  | "payment"
  | "system";

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Analytics Types
export interface ShopAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: Product;
    sales: number;
    revenue: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    revenue: number;
  }>;
}

