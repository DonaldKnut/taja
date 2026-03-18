import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface ISupportTicket extends Document {
  ticketNumber: string;
  user: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category:
    | 'order'
    | 'payment'
    | 'payout'
    | 'shop'
    | 'product'
    | 'account'
    | 'delivery'
    | 'refund'
    | 'technical'
    | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId; // Admin or support staff
  relatedOrder?: mongoose.Types.ObjectId;
  relatedProduct?: mongoose.Types.ObjectId;
  relatedShop?: mongoose.Types.ObjectId;
  messages: Array<{
    _id?: mongoose.Types.ObjectId;
    sender?: mongoose.Types.ObjectId;
    senderRole: 'user' | 'admin' | 'seller' | 'system';
    content: string;
    attachments?: Array<{
      url: string;
      filename: string;
      type: string;
      size: number;
    }>;
    isInternal?: boolean; // Internal notes visible only to staff
    createdAt: Date;
  }>;
  attachments?: Array<{
    url: string;
    filename: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  tags?: string[];
  firstResponseAt?: Date;
  lastCustomerMessageAt?: Date;
  lastStaffMessageAt?: Date;
  seenBy?: Array<{
    user: mongoose.Types.ObjectId;
    seenAt: Date;
  }>;
  resolvedAt?: Date;
  closedAt?: Date;
  satisfactionRating?: number; // 1-5 after resolution
  satisfactionFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `TKT-${Date.now()}-${random}`;
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Ticket subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'order',
        'payment',
        'payout',
        'shop',
        'product',
        'account',
        'delivery',
        'refund',
        'technical',
        'general',
      ],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedProduct: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    relatedShop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
    },
    messages: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        senderRole: {
          type: String,
          enum: ['user', 'admin', 'seller', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        attachments: [
          {
            url: String,
            filename: String,
            type: String,
            size: Number,
          },
        ],
        isInternal: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        url: String,
        filename: String,
        type: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    firstResponseAt: Date,
    lastCustomerMessageAt: Date,
    lastStaffMessageAt: Date,
    seenBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        seenAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: Date,
    closedAt: Date,
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    satisfactionFeedback: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
SupportTicketSchema.index({ user: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ priority: 1 });
SupportTicketSchema.index({ category: 1 });
SupportTicketSchema.index({ assignedTo: 1 });
// Note: ticketNumber already has `unique: true` which creates an index automatically
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ relatedOrder: 1 });
SupportTicketSchema.index({ relatedProduct: 1 });
SupportTicketSchema.index({ relatedShop: 1 });
SupportTicketSchema.index({ lastCustomerMessageAt: -1 });
SupportTicketSchema.index({ lastStaffMessageAt: -1 });
SupportTicketSchema.index({ 'seenBy.user': 1 });

// Ensure ticketNumber exists before validation runs (required validator happens before save hooks)
SupportTicketSchema.pre('validate', function (next) {
  if (!this.ticketNumber) {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.ticketNumber = `TKT-${Date.now()}-${random}`;
  }
  next();
});

// Auto-update status timestamps
SupportTicketSchema.pre('save', function (next) {
  // Set firstResponseAt when first admin/seller message is added
  if (this.isModified('messages') && this.messages.length > 0) {
    const hasStaffResponse = this.messages.some(
      (msg) => msg.senderRole === 'admin' || msg.senderRole === 'seller'
    );
    if (hasStaffResponse && !this.firstResponseAt) {
      this.firstResponseAt = new Date();
    }

    // Maintain last message timestamps for inbox signals.
    // Ignore internal notes for customer visibility, but still count them as staff activity.
    const last = this.messages[this.messages.length - 1] as any;
    if (last?.createdAt) {
      if (last.senderRole === 'admin' || last.senderRole === 'seller') {
        this.lastStaffMessageAt = new Date(last.createdAt);
      } else {
        this.lastCustomerMessageAt = new Date(last.createdAt);
      }
    }
  }

  // Set resolvedAt when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }

  // Set closedAt when status changes to closed
  if (this.isModified('status') && this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }

  next();
});

const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;

