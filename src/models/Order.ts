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
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded' | 'disputed';
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
  // Seller-managed delivery
  delivery: {
    // Tracking information provided by seller
    trackingNumber?: string;
    carrier?: string; // e.g., "Gokada", "DHL", "FedEx", "Self"
    trackingUrl?: string; // External tracking URL
    shippingLabel?: string; // URL to shipping label if generated
    // Timestamps
    shippedAt?: Date;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    // Buyer confirmation (escrow release gate)
    buyerConfirmedAt?: Date;
    autoConfirmAt?: Date; // 7 days after marked delivered
    // Seller notes
    sellerNotes?: string; // e.g., "Call before delivery", "Fragile items"
  };
  // Buyer confirmation workflow
  buyerConfirmation: {
    status: 'pending' | 'confirmed' | 'auto_confirmed' | 'disputed';
    confirmedAt?: Date;
    disputedAt?: Date;
    disputeReason?: 'not_received' | 'damaged' | 'wrong_item' | 'not_as_described' | 'other';
    disputeDescription?: string;
    disputeEvidence?: string[]; // URLs to images/evidence
  };
  // Dispute resolution (if applicable)
  dispute?: {
    openedAt: Date;
    openedBy: mongoose.Types.ObjectId;
    reason: string;
    description: string;
    evidence: string[];
    status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'resolved_split';
    adminId?: mongoose.Types.ObjectId;
    adminNotes?: string;
    resolution?: {
      decision: 'full_refund' | 'partial_refund' | 'no_refund' | 'reship';
      refundAmount?: number;
      notes: string;
      resolvedAt: Date;
    };
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
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed'],
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
      trackingNumber: String,
      carrier: String,
      trackingUrl: String,
      shippingLabel: String,
      shippedAt: Date,
      estimatedDelivery: Date,
      deliveredAt: Date,
      buyerConfirmedAt: Date,
      autoConfirmAt: Date,
      sellerNotes: String,
    },
    buyerConfirmation: {
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'auto_confirmed', 'disputed'],
        default: 'pending',
      },
      confirmedAt: Date,
      disputedAt: Date,
      disputeReason: {
        type: String,
        enum: ['not_received', 'damaged', 'wrong_item', 'not_as_described', 'other'],
      },
      disputeDescription: String,
      disputeEvidence: [String],
    },
    dispute: {
      openedAt: Date,
      openedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      description: String,
      evidence: [String],
      status: {
        type: String,
        enum: ['open', 'under_review', 'resolved_buyer', 'resolved_seller', 'resolved_split'],
        default: 'open',
      },
      adminId: { type: Schema.Types.ObjectId, ref: 'User' },
      adminNotes: String,
      resolution: {
        decision: {
          type: String,
          enum: ['full_refund', 'partial_refund', 'no_refund', 'reship'],
        },
        refundAmount: Number,
        notes: String,
        resolvedAt: Date,
      },
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

// Generate order number before saving/validation
OrderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.models.Order?.countDocuments() || 0;
    this.orderNumber = `TAJA-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;


