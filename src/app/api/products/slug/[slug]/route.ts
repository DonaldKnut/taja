import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Category';
import '@/models/Shop';
import '@/models/User';
import { authenticate } from '@/lib/middleware';
import { notifyOwnerViewAlert } from '@/lib/notifications';
import { applyProductViewHit, attachProductViewDedupeCookie } from '@/lib/productViewIncrement';
import { hashProductViewerIp, recordProductViewTelemetry } from '@/lib/productViewAnalytics';

export const dynamic = 'force-dynamic';

// GET /api/products/slug/:slug - Get product by slug (canonical slug path; same view rules as /api/products/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const product = await Product.findOne({ slug: params.slug, status: 'active' })
      .populate('seller', 'fullName avatar email')
      .populate('shop', 'shopName shopSlug logo banner address')
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    const productIdStr = String((product as any)._id);
    const auth = await authenticate(request);
    const sellerId =
      typeof product.seller === 'object' && (product.seller as any)?._id
        ? String((product.seller as any)._id)
        : String((product as any).seller);
    const viewerUserId = auth.user?.userId ? String(auth.user.userId) : null;
    const skipViewIncrement = Boolean(viewerUserId && viewerUserId === sellerId);

    const { views: resolvedViews, setDedupeCookie } = await applyProductViewHit(
      request,
      productIdStr,
      { views: (product as any).views },
      { skipIncrement: skipViewIncrement }
    );
    const productPayload = { ...(product as any), views: resolvedViews };

    if (!skipViewIncrement) {
      recordProductViewTelemetry({
        productId: productIdStr,
        userId: viewerUserId,
        ipHash: hashProductViewerIp(request),
      });
    }

    try {
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
          entityId: productIdStr,
          entityName: (product as any).title,
          entitySlug: (product as any).slug,
          viewerName,
          viewerKey,
        });
      }
    } catch (notifyError) {
      console.error('Product view notification error:', notifyError);
    }

    const res = NextResponse.json({
      success: true,
      data: productPayload,
    });
    if (setDedupeCookie) {
      attachProductViewDedupeCookie(res, productIdStr);
    }
    return res;
  } catch (error: any) {
    console.error('Get product by slug error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
