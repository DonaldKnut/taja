import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';

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

    // Increment view count
    await Shop.findByIdAndUpdate(shop._id, {
      $inc: { 'stats.viewCount': 1 },
    });

    // Calculate dynamic stats and fetch products for showroom
    const Product = (await import('@/models/Product')).default;
    const Order = (await import('@/models/Order')).default;
    const Review = (await import('@/models/Review')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const [productCount, ordersResult, reviews, followerCount, products] = await Promise.all([
      Product.countDocuments({ shop: shop._id, status: { $ne: 'deleted' } }),
      Order.aggregate([
        { $match: { shop: shop._id } },
        { $group: { _id: null, count: { $sum: 1 }, totalRevenue: { $sum: '$totals.total' } } },
      ]),
      Review.aggregate([
        { $match: { shop: shop._id } },
        { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
      ]),
      ShopFollow.countDocuments({ shop: shop._id }),
      Product.find({ shop: shop._id, status: 'active' })
        .select('title slug price images condition category status createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const orderData = ordersResult[0] || { count: 0, totalRevenue: 0 };
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
        totalRevenue: orderData.totalRevenue || 0,
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

