import mongoose, { Schema, Document, Model } from "mongoose";
import "./User";
import "./Category";

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
  categories?: string[];
  categoryIds?: mongoose.Types.ObjectId[];
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
    tiktok?: string;
    whatsapp?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
    youtube?: string;
    linkedin?: string;
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
    /**
     * Global delivery configuration & minimum order quantity (shop-level).
     * Used when there is no product-level shipping override.
     */
    globalDeliveryEnabled?: boolean;
    /** Minimum order amount in Naira required for delivery (0 = no minimum). */
    globalMinOrderAmount?: number;
    /**
     * Delivery fee tiers based on total order weight (in kg) for this shop.
     * Evaluated against the summed product.weight * quantity for the order.
     */
    deliveryFeeTiers?: Array<{
      minWeightKg: number;
      maxWeightKg: number;
      priceNaira: number;
    }>;
    /**
     * Seller-defined delivery slots for capacity planning.
     * Currently used for configuration and display; order assignment can build on this.
     */
    deliverySlots?: Array<{
      id: string;
      date: Date;
      startTime: string;
      endTime?: string;
      maxOrders: number;
      notes?: string;
      active?: boolean;
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
    categories: {
      type: [String],
      default: [],
    },
    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
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
      pickupPoints: [
        {
          name: String,
          address: String,
          city: String,
          state: String,
          phone: String,
        },
      ],
      globalDeliveryEnabled: { type: Boolean, default: true },
      globalMinOrderAmount: { type: Number, default: 0 },
      deliveryFeeTiers: [
        {
          minWeightKg: { type: Number, default: 0 },
          maxWeightKg: { type: Number, required: true },
          priceNaira: { type: Number, required: true },
        },
      ],
      deliverySlots: [
        {
          id: { type: String, required: true },
          date: { type: Date, required: true },
          startTime: { type: String, required: true },
          endTime: String,
          maxOrders: { type: Number, required: true },
          notes: String,
          active: { type: Boolean, default: true },
        },
      ],
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
ShopSchema.index({ categories: 1 });

const Shop: Model<IShop> = mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);

export default Shop;


