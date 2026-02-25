import mongoose, { Schema, Document, Model } from "mongoose";

export type WalletTransactionType =
  | "wallet_funding"
  | "withdrawal"
  | "referral_bonus"
  | "sale_proceeds"
  | "adjustment";

export type WalletTransactionStatus =
  | "pending"
  | "held"
  | "success"
  | "failed"
  | "reversed";

export interface IWalletTransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  direction: "credit" | "debit";
  amount: number; // stored in minor units (kobo) to avoid floating point errors
  currency: "NGN";
  reference: string; // unique idempotency key
  provider?: "paystack" | "flutterwave" | "internal";
  providerReference?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["wallet_funding", "withdrawal", "referral_bonus", "sale_proceeds", "adjustment"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "held", "success", "failed", "reversed"],
      default: "pending",
      index: true,
    },
    direction: { type: String, enum: ["credit", "debit"], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    reference: { type: String, required: true, unique: true, index: true },
    provider: { type: String, enum: ["paystack", "flutterwave", "internal"], default: "internal" },
    providerReference: String,
    description: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ user: 1, createdAt: -1 });

const WalletTransaction: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);

export default WalletTransaction;

