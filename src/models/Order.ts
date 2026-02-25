import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  shop: mongoose.Types.ObjectId;
  items: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    title: string;
    image?: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'flutterwave' | 'paystack' | 'bank_transfer' | 'cod' | 'crypto';
  paymentReference?: string;
  escrowStatus?: 'pending' | 'funded' | 'released' | 'refunded';
  escrowReference?: string;
  escrowHold?: {
    orderId: string;
    amount: number;
    platformFee: number;
    sellerAmount: number;
    status: 'held' | 'released' | 'refunded';
    holdReference?: string;
    releasedAt?: Date;
    refundedAt?: Date;
    createdAt: Date;
  };
  payoutReference?: string;
  payoutStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  payoutCompletedAt?: Date;
  refundReason?: string;
  delivery: {
    provider?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    confirmedAt?: Date; // buyer confirmation (escrow release gate)
  };
  coupon?: {
    code: string;
    discount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
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
        price: {
          type: Number,
          required: true,
        },
        title: String,
        image: String,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'Nigeria' },
    },
    totals: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['flutterwave', 'paystack', 'bank_transfer', 'cod', 'crypto'],
    },
    paymentReference: String,
    escrowStatus: {
      type: String,
      enum: ['pending', 'funded', 'released', 'refunded'],
    },
    escrowReference: String,
    escrowHold: {
      orderId: String,
      amount: Number,
      platformFee: Number,
      sellerAmount: Number,
      status: {
        type: String,
        enum: ['held', 'released', 'refunded'],
      },
      holdReference: String,
      releasedAt: Date,
      refundedAt: Date,
      createdAt: { type: Date, default: Date.now },
    },
    payoutReference: String,
    payoutStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
    },
    payoutCompletedAt: Date,
    refundReason: String,
    delivery: {
      provider: String,
      trackingNumber: String,
      estimatedDelivery: Date,
      deliveredAt: Date,
      confirmedAt: Date,
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
// Note: orderNumber already has unique: true which creates an index automatically
OrderSchema.index({ buyer: 1 });
OrderSchema.index({ seller: 1 });
OrderSchema.index({ shop: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.models.Order?.countDocuments() || 0;
    this.orderNumber = `TAJA-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;


