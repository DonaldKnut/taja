import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IWishlist extends Document {
    user: mongoose.Types.ObjectId;
    products: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One wishlist per user
        },
        products: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Define indexes for performance
wishlistSchema.index({ user: 1 });

const Wishlist: Model<IWishlist> = mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', wishlistSchema);

export default Wishlist;
