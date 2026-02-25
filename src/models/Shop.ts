import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShop extends Document {
  owner: mongoose.Types.ObjectId;
  shopName: string;
  shopSlug: string;
  /**
   * Short description / tagline shown on cards and headers
   */
  description?: string;
  /**
   * Longer “about” text for the shop’s About section
   */
  about?: string;
  /**
   * Optional one-line tagline highlighted near the shop name
   */
  tagline?: string;
  category?: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  /**
   * Legacy fields used across the app today.
   * `logo` is effectively the shop avatar and `banner` the cover image.
   */
  logo?: string;
  banner?: string;
  /**
   * New explicit avatar / cover fields. We keep logo/banner for backward compatibility
   * but surface avatar/coverImage in the API responses.
   */
  avatar?: string;
  coverImage?: string;
  /**
   * Social links rendered on the shop page
   */
  socialLinks?: {
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  /**
   * Shop settings used for response time, shipping options, policies, delivery, etc.
   */
  settings?: {
    responseTime?: string;
    shippingMethods?: string[];
    returnPolicy?: string;
    /** Default delivery fee in Naira when product has no shipping cost */
    defaultDeliveryFee?: number;
    /** Pickup / drop-off points for buyers */
    pickupPoints?: Array<{
      name: string;
      address: string;
      city: string;
      state: string;
      phone?: string;
    }>;
  };
  /**
   * Optional extended policies block (for future expansion)
   */
  policies?: {
    returns?: string;
    shipping?: string;
    cancellations?: string;
    [key: string]: any;
  };
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: Date;
    verifiedBy?: mongoose.Types.ObjectId;
    documents?: Array<{
      type: string;
      url: string;
      uploadedAt: Date;
    }>;
  };
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
    followerCount: number;
    viewCount: number;
  };
  status: 'pending' | 'active' | 'suspended' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shopName: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    shopSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: String,
    category: String,
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'Nigeria' },
    },
    logo: String,
    banner: String,
    avatar: String,
    coverImage: String,
    tagline: String,
    socialLinks: {
      instagram: String,
      whatsapp: String,
      twitter: String,
      facebook: String,
      website: String,
    },
    settings: {
      responseTime: String,
      shippingMethods: [String],
      returnPolicy: String,
      defaultDeliveryFee: { type: Number, default: 0 },
      pickupPoints: [{
        name: String,
        address: String,
        city: String,
        state: String,
        phone: String,
      }],
    },
    policies: {
      returns: String,
      shipping: String,
      cancellations: String,
    },
    verification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
      },
      verifiedAt: Date,
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      documents: [
        {
          type: String,
          url: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      followerCount: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'banned'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: shopSlug already has unique: true which creates an index automatically
ShopSchema.index({ owner: 1 });
ShopSchema.index({ status: 1 });
ShopSchema.index({ 'verification.status': 1 });

const Shop: Model<IShop> = mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;


