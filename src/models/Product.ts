import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  seller: mongoose.Types.ObjectId;
  shop?: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  videos?: Array<{
    url: string;
    thumbnail?: string;
    duration?: number;
    type: 'video';
  }>;
  inventory: {
    quantity: number;
    sku?: string;
    trackQuantity: boolean;
    /** Minimum order quantity (default 1) */
    moq?: number;
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    shippingCost: number;
    /** Optional: cost per kg for weight-based pricing (logistics-style) */
    costPerKg?: number;
    /** Optional: tiered delivery by max weight (kg) => cost in Naira */
    weightTiers?: Array< { maxWeightKg: number; costNaira: number } >;
    processingTime: '1-2-days' | '3-5-days' | '1-week' | '2-weeks';
  };
  specifications: Record<string, any>;
  seo: {
    tags: string[];
    metaTitle?: string;
    metaDescription?: string;
  };
  status: 'draft' | 'active' | 'out_of_stock' | 'suspended' | 'deleted';
  featured: boolean;
  views: number;
  likes: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    longDescription: String,
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory: String,
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair', 'poor'],
      default: 'new',
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare at price must be positive'],
    },
    currency: {
      type: String,
      default: 'NGN',
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    videos: [
      {
        url: String,
        thumbnail: String,
        duration: Number,
        type: { type: String, default: 'video' },
      },
    ],
    inventory: {
      quantity: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative'],
      },
      sku: String,
      trackQuantity: { type: Boolean, default: true },
      moq: { type: Number, default: 1, min: [1, 'MOQ must be at least 1'] },
    },
    shipping: {
      weight: { type: Number, default: 0 },
      dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
      freeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, default: 0 },
      costPerKg: { type: Number, min: 0 },
      weightTiers: [
        { maxWeightKg: Number, costNaira: Number },
      ],
      processingTime: {
        type: String,
        enum: ['1-2-days', '3-5-days', '1-week', '2-weeks'],
        default: '3-5-days',
      },
    },
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    seo: {
      tags: [String],
      metaTitle: String,
      metaDescription: String,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'out_of_stock', 'suspended', 'deleted'],
      default: 'draft',
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: slug already has unique: true which creates an index automatically
ProductSchema.index({ seller: 1 });
ProductSchema.index({ shop: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ title: 'text', description: 'text' }); // Text search

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

