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
      .populate('owner', 'fullName avatar email')
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

    // Calculate dynamic stats
    const Product = (await import('@/models/Product')).default;
    const Order = (await import('@/models/Order')).default;
    const Review = (await import('@/models/Review')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const [totalProducts, totalOrders, reviews, followerCount] = await Promise.all([
      Product.countDocuments({ shop: shop._id, status: { $ne: 'deleted' } }),
      Order.countDocuments({ shop: shop._id }),
      Review.aggregate([
        { $match: { shop: shop._id } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
      ShopFollow.countDocuments({ shop: shop._id }),
    ]);

    const reviewData = reviews[0] || { averageRating: 0, reviewCount: 0 };

    // Return shop with dynamic stats
    const updatedShop = {
      ...shop,
      // Normalise avatar / cover fields for the frontend
      avatar: (shop as any).avatar || shop.logo,
      coverImage: (shop as any).coverImage || shop.banner,
      stats: {
        ...shop.stats,
        totalProducts,
        totalOrders,
        averageRating: Math.round(reviewData.averageRating * 10) / 10,
        reviewCount: reviewData.reviewCount,
        followerCount,
      },
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

