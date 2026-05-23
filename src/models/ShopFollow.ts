import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShopFollow extends Document {
  user: mongoose.Types.ObjectId;
  shop: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ShopFollowSchema = new Schema<IShopFollow>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one follow per user-shop pair
ShopFollowSchema.index({ user: 1, shop: 1 }, { unique: true });
ShopFollowSchema.index({ shop: 1 });

const ShopFollow: Model<IShopFollow> =
  mongoose.models.ShopFollow || mongoose.model<IShopFollow>('ShopFollow', ShopFollowSchema);

export default ShopFollow;








