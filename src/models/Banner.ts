import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBanner extends Document {
  name: string;
  title?: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  linkText?: string;
  position: 'homepage_hero' | 'homepage_featured' | 'category_page' | 'product_page' | 'cart_page' | 'sidebar';
  type: 'image' | 'video' | 'html';
  htmlContent?: string;
  backgroundColor?: string;
  textColor?: string;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  status: 'active' | 'inactive' | 'scheduled';
  targetAudience?: {
    userTypes?: ('guest' | 'buyer' | 'seller' | 'all')[];
    categories?: mongoose.Types.ObjectId[];
  };
  metadata: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    mobileImage: {
      type: String,
    },
    link: {
      type: String,
    },
    linkText: {
      type: String,
      default: 'Learn More',
    },
    position: {
      type: String,
      enum: ['homepage_hero', 'homepage_featured', 'category_page', 'product_page', 'cart_page', 'sidebar'],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['image', 'video', 'html'],
      default: 'image',
    },
    htmlContent: {
      type: String,
    },
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    textColor: {
      type: String,
      default: '#000000',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'scheduled'],
      default: 'inactive',
      index: true,
    },
    targetAudience: {
      userTypes: [{
        type: String,
        enum: ['guest', 'buyer', 'seller', 'all'],
      }],
      categories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
      }],
    },
    metadata: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BannerSchema.index({ position: 1, status: 1, priority: -1 });
BannerSchema.index({ status: 1, startDate: 1, endDate: 1 });

// Pre-save middleware to update status based on dates
BannerSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.startDate && this.endDate) {
    if (now < this.startDate) {
      this.status = 'scheduled';
    } else if (now > this.endDate) {
      this.status = 'inactive';
    }
  }
  
  // Calculate CTR
  if (this.metadata.impressions > 0) {
    this.metadata.ctr = (this.metadata.clicks / this.metadata.impressions) * 100;
  }
  
  next();
});

const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
