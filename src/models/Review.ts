import mongoose, { Schema, Document, Model } from 'mongoose';
import Shop from './Shop';
import Product from './Product';

export interface IReview extends Document {
  reviewer: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  shop?: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  helpful: number;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: String,
    comment: {
      type: String,
      required: true,
    },
    images: [String],
    helpful: {
      type: Number,
      default: 0,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ shop: 1 });
ReviewSchema.index({ reviewer: 1 });
ReviewSchema.index({ order: 1 });

// Update product/shop ratings when review is saved
ReviewSchema.post('save', async function () {
  const ReviewModel = mongoose.model('Review');
  if (this.product) {
    const reviews = await ReviewModel.find({ product: this.product });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(this.product, {
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  }
  if (this.shop) {
    const reviews = await ReviewModel.find({ shop: this.shop });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Shop.findByIdAndUpdate(this.shop, {
      'stats.averageRating': Math.round(avgRating * 10) / 10,
      'stats.reviewCount': reviews.length,
    });
  }
});

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;








