import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import { authenticate } from '@/lib/middleware';
import { notifyOwnerViewAlert } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET /api/shops/slug/:slug - Get shop by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const shop = await Shop.findOne({ shopSlug: params.slug.toLowerCase() })
      .populate('owner', 'fullName avatar email createdAt')
      .lean();

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Buyers should not see sellers that haven't been vouched/approved yet.
    // Sellers (shop owners) and admins can still access their own shop page for setup/review.
    if (shop.status !== 'active') {
      const auth = await authenticate(request);
      const isAdmin = auth.user?.role === 'admin';
      const isOwner = auth.user && shop.owner?._id && String(shop.owner._id) === String(auth.user.userId);

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }
    }

    // Increment view count
    await Shop.findByIdAndUpdate(shop._id, {
      $inc: { 'stats.viewCount': 1 },
    });

    // Notify shop owner that their shop was viewed (throttled per viewer + shop).
    try {
      const auth = await authenticate(request);
      const ownerId =
        typeof (shop as any).owner === 'object' && (shop as any).owner?._id
          ? String((shop as any).owner._id)
          : String((shop as any).owner);
      const viewerUserId = auth.user?.userId ? String(auth.user.userId) : null;
      const viewerName = auth.user?.fullName || undefined;
      const forwardedFor = request.headers.get('x-forwarded-for') || '';
      const ip = forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
      const ua = request.headers.get('user-agent') || 'unknown-ua';
      const anonViewerKey = `anon:${ip}:${ua.slice(0, 80)}`;
      const viewerKey = viewerUserId ? `user:${viewerUserId}` : anonViewerKey;

      if (ownerId && viewerUserId !== ownerId) {
        await notifyOwnerViewAlert({
          ownerUserId: ownerId,
          entityType: 'shop',
          entityId: String((shop as any)._id),
          entityName: (shop as any).shopName,
          entitySlug: (shop as any).shopSlug,
          viewerName,
          viewerKey,
        });
      }
    } catch (notifyError) {
      console.error('Shop view notification error:', notifyError);
    }

    // Calculate dynamic stats and fetch products for showroom
    const Product = (await import('@/models/Product')).default;
    const Order = (await import('@/models/Order')).default;
    const Review = (await import('@/models/Review')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const [productCount, ordersResult, reviews, followerCount, products] = await Promise.all([
      Product.countDocuments({ shop: shop._id, status: { $ne: 'deleted' } }),
      Order.aggregate([
        { $match: { shop: shop._id } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            settledCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentStatus', 'paid'] },
                      {
                        $in: [
                          '$buyerConfirmation.status',
                          ['confirmed', 'auto_confirmed'],
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            settledRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentStatus', 'paid'] },
                      {
                        $in: [
                          '$buyerConfirmation.status',
                          ['confirmed', 'auto_confirmed'],
                        ],
                      },
                    ],
                  },
                  '$totals.total',
                  0,
                ],
              },
            },
          },
        },
      ]),
      Review.aggregate([
        { $match: { shop: shop._id } },
        { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
      ]),
      ShopFollow.countDocuments({ shop: shop._id }),
      Product.find({ shop: shop._id, status: 'active' })
        .select('title slug price maxPrice images condition category status createdAt variants likes')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const orderData = ordersResult[0] || { count: 0, settledCount: 0, settledRevenue: 0 };
    const reviewData = reviews[0] || { averageRating: 0, reviewCount: 0 };

    // Normalise product shape for ProductCard (id, _id, shopSlug, etc.)
    const productsForFeed = (products as any[]).map((p) => ({
      ...p,
      _id: p._id.toString(),
      id: p._id.toString(),
      shopSlug: (shop as any).shopSlug,
      category: typeof p.category === 'object' ? (p.category as any)?.name : p.category,
    }));

    // Return shop with dynamic stats and products for full showroom
    const updatedShop = {
      ...shop,
      categories: (shop as any).categories && (shop as any).categories.length > 0
        ? (shop as any).categories
        : (shop as any).category
          ? [(shop as any).category]
          : [],
      categoryIds: ((shop as any).categoryIds || []).map((id: any) => id.toString()),
      avatar: (shop as any).avatar || shop.logo,
      coverImage: (shop as any).coverImage || shop.banner,
      verification: {
        ...(shop as any).verification,
        isVerified: (shop as any).verification?.status === 'verified',
      },
      stats: {
        ...(shop as any).stats,
        totalProducts: productCount,
        totalOrders: orderData.count,
        totalRevenue: orderData.settledRevenue || 0,
        averageRating: Math.round((reviewData.averageRating || 0) * 10) / 10,
        reviewCount: reviewData.reviewCount || 0,
        followerCount,
      },
      products: productsForFeed,
    };

    return NextResponse.json({
      success: true,
      data: updatedShop,
    });
  } catch (error: any) {
    console.error('Get shop by slug error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shop' },
      { status: 500 }
    );
  }
}

