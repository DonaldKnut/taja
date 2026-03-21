import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category'; // Explicitly import for registration
import Shop from '@/models/Shop';         // Explicitly import for registration
import User from '@/models/User';         // Explicitly import for registration
import { authenticate } from '@/lib/middleware';
import { notifyOwnerViewAlert } from '@/lib/notifications';
export const dynamic = 'force-dynamic';

// GET /api/products/slug/:slug - Get product by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const product = await Product.findOne({ slug: params.slug, status: 'active' })
      .populate('seller', 'fullName avatar email')
      .populate('shop', 'shopName shopSlug logo banner')
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment views
    await Product.findOneAndUpdate({ slug: params.slug }, { $inc: { views: 1 } });

    // Notify seller that their product is being viewed (throttled per viewer + product).
    try {
      const auth = await authenticate(request);
      const sellerId =
        typeof product.seller === 'object' && (product.seller as any)?._id
          ? String((product.seller as any)._id)
          : String((product as any).seller);
      const viewerUserId = auth.user?.userId ? String(auth.user.userId) : null;
      const viewerName = auth.user?.fullName || undefined;
      const forwardedFor = request.headers.get('x-forwarded-for') || '';
      const ip = forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
      const ua = request.headers.get('user-agent') || 'unknown-ua';
      const anonViewerKey = `anon:${ip}:${ua.slice(0, 80)}`;
      const viewerKey = viewerUserId ? `user:${viewerUserId}` : anonViewerKey;

      if (sellerId && viewerUserId !== sellerId) {
        await notifyOwnerViewAlert({
          ownerUserId: sellerId,
          entityType: 'product',
          entityId: String((product as any)._id),
          entityName: (product as any).title,
          entitySlug: (product as any).slug,
          viewerName,
          viewerKey,
        });
      }
    } catch (notifyError) {
      console.error('Product view notification error:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Get product by slug error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}








