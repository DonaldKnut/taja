import mongoose, { Schema, Document, Model } from "mongoose";
import "./Product";

export interface IProductViewPresence extends Document {
  product: mongoose.Types.ObjectId;
  viewerId: string;
  lastSeen: Date;
}

const ProductViewPresenceSchema = new Schema<IProductViewPresence>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    viewerId: { type: String, required: true, trim: true, maxlength: 128 },
    lastSeen: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

ProductViewPresenceSchema.index({ product: 1, viewerId: 1 }, { unique: true });

const ProductViewPresence: Model<IProductViewPresence> =
  mongoose.models.ProductViewPresence ||
  mongoose.model<IProductViewPresence>("ProductViewPresence", ProductViewPresenceSchema);

export default ProductViewPresence;
