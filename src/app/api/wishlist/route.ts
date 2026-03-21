import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware';
import connectDB from '@/lib/db';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/Product';
import Shop from '@/models/Shop'; // ensures Shop model is loaded for population
import { notifySellerProductLiked } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (!user || error) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.userId;

        await connectDB();

        const wishlist = await Wishlist.findOne({ user: userId }).populate({
            path: 'products',
            select: 'title price images shop slug status inventory likes',
            populate: {
                path: 'shop',
                select: 'shopName shopSlug'
            }
        });

        // If no wishlist exists, return empty array
        if (!wishlist) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Filter out deleted/inactive products
        const validProducts = wishlist.products.filter((p: any) => p && p.status === 'active');

        // Optional: If valid products length is different, we could save the filtered array back to DB
        // to auto-clean wishlists. We'll skip for now to avoid side-effects in GET requests.

        return NextResponse.json({
            success: true,
            data: validProducts
        });
    } catch (error: any) {
        console.error('Fetch wishlist error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch wishlist' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, error } = await authenticate(request);
        if (!user || error) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.userId;

        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
        }

        await connectDB();

        // Ensure product exists and is active
        const product = await Product.findOne({ _id: productId, status: 'active' });
        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found or unavailable' }, { status: 404 });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                products: [productId]
            });
            return NextResponse.json({ success: true, message: 'Added to wishlist', isWishlisted: true });
        }

        // Check if product is already in wishlist
        const productIndex = wishlist.products.findIndex((id: any) => String(id) === String(productId));
        let isWishlisted = false;

        if (productIndex > -1) {
            // Remove it
            wishlist.products.splice(productIndex, 1);
            isWishlisted = false;
            await Product.findByIdAndUpdate(productId, { $inc: { likes: -1 } });
            await Product.updateOne({ _id: productId, likes: { $lt: 0 } }, { $set: { likes: 0 } });
        } else {
            // Add it
            wishlist.products.push(productId);
            isWishlisted = true;
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { $inc: { likes: 1 } },
                { new: true }
            ).select('seller title likes');

            // Notify seller of new like/wishlist (avoid self-notify).
            if (updatedProduct && String((updatedProduct as any).seller) !== String(userId)) {
                const likerName = user.fullName || user.email || undefined;
                const likerKey = `user:${userId}`;
                await notifySellerProductLiked({
                    sellerUserId: String((updatedProduct as any).seller),
                    productId: String(updatedProduct._id),
                    productTitle: (updatedProduct as any).title,
                    likerName,
                    likerKey,
                    likesCount: (updatedProduct as any).likes,
                });
            }
        }

        await wishlist.save();

        return NextResponse.json({
            success: true,
            message: isWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
            isWishlisted
        });
    } catch (error: any) {
        console.error('Toggle wishlist error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update wishlist' },
            { status: 500 }
        );
    }
}
