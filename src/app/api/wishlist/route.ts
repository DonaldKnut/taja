import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware';
import connectDB from '@/lib/db';
import Wishlist from '@/models/Wishlist';
import Product from '@/models/Product';
import Shop from '@/models/Shop'; // ensures Shop model is loaded for population

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
            select: 'title price images shop slug status inventory',
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
        const productIndex = wishlist.products.indexOf(productId);
        let isWishlisted = false;

        if (productIndex > -1) {
            // Remove it
            wishlist.products.splice(productIndex, 1);
            isWishlisted = false;
        } else {
            // Add it
            wishlist.products.push(productId);
            isWishlisted = true;
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
