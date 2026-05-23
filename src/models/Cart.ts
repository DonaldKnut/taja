import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    variantId?: string;
    variantName?: string;
    addedAt: Date;
  }>;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  coupon?: {
    code: string;
    discount: number;
  };
  updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        variantId: {
          type: String,
        },
        variantName: {
          type: String,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totals: {
      subtotal: { type: Number, default: 0 },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    coupon: {
      code: String,
      discount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: user already has `unique: true` which creates an index automatically

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);

export default Cart;








