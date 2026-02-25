import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/shops/:shopId - Get shop by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    await connectDB();

      const shop = await Shop.findById(params.shopId)
        .populate('owner', 'fullName avatar email')
        .lean();

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Calculate dynamic stats
    const Product = (await import('@/models/Product')).default;
    const Order = (await import('@/models/Order')).default;
    const Review = (await import('@/models/Review')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const [totalProducts, totalOrders, reviews, followerCount] = await Promise.all([
      Product.countDocuments({ shop: params.shopId, status: { $ne: 'deleted' } }),
      Order.countDocuments({ shop: params.shopId }),
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
      ShopFollow.countDocuments({ shop: params.shopId }),
    ]);

    const reviewData = reviews[0] || { averageRating: 0, reviewCount: 0 };

    // Update shop with dynamic stats
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
    console.error('Get shop error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shop' },
      { status: 500 }
    );
  }
}

// PUT /api/shops/:shopId - Update shop
export async function PUT(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const shop = await Shop.findById(params.shopId);

      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      // Check if user owns the shop or is admin
      if (shop.owner.toString() !== user.userId && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const {
        shopName,
        description,
        about,
        tagline,
        category,
        logo,
        banner,
        avatar,
        coverImage,
        address,
        socialLinks,
        settings,
        policies,
      } = body;

      if (shopName) shop.shopName = shopName;
      if (description !== undefined) shop.description = description;
      if (about !== undefined) (shop as any).about = about;
      if (tagline !== undefined) (shop as any).tagline = tagline;
      if (category) shop.category = category;
      if (logo) shop.logo = logo;
      if (banner) shop.banner = banner;
      if (avatar) (shop as any).avatar = avatar;
      if (coverImage) (shop as any).coverImage = coverImage;
      if (address) shop.address = { ...shop.address, ...address };
      if (socialLinks) (shop as any).socialLinks = { ...(shop as any).socialLinks, ...socialLinks };
      if (settings) (shop as any).settings = { ...(shop as any).settings, ...settings };
      if (policies) (shop as any).policies = { ...(shop as any).policies, ...policies };

      await shop.save();

      return NextResponse.json({
        success: true,
        message: 'Shop updated successfully',
        data: shop,
      });
    } catch (error: any) {
      console.error('Update shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update shop' },
        { status: 500 }
      );
    }
  })(request);
}

