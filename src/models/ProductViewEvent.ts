import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductViewEvent extends Document {
  product: mongoose.Types.ObjectId;
  recordedAt: Date;
  /** Authenticated viewer (string ObjectId), if any */
  userId?: string | null;
  /** sha256-based hash of client IP (never store raw IP) */
  ipHash: string;
}

const ProductViewEventSchema = new Schema<IProductViewEvent>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    recordedAt: { type: Date, default: Date.now, index: true },
    userId: { type: String, trim: true, default: null, index: true },
    ipHash: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: false }
);

ProductViewEventSchema.index({ product: 1, recordedAt: -1 });
ProductViewEventSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ProductViewEvent: Model<IProductViewEvent> =
  mongoose.models.ProductViewEvent ||
  mongoose.model<IProductViewEvent>("ProductViewEvent", ProductViewEventSchema);

export default ProductViewEvent;
