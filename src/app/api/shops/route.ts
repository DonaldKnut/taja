import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { notifyAdminsNewShop } from '@/lib/notifications';
import { sendAdminNewShopEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/shops - Get all shops
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const verified = searchParams.get('verified');

    const query: any = { status: 'active' };

    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (verified !== null) {
      query['verification.status'] = verified === 'true' ? 'verified' : { $ne: 'verified' };
    }

    const skip = (page - 1) * limit;

    const shops = await Shop.find(query)
      .populate('owner', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Shop.countDocuments(query);

    // Calculate dynamic stats for each shop
    const Product = (await import('@/models/Product')).default;
    const ShopFollow = (await import('@/models/ShopFollow')).default;

    const shopsWithStats = await Promise.all(
      shops.map(async (shop) => {
        const [totalProducts, followerCount] = await Promise.all([
          Product.countDocuments({ shop: shop._id, status: { $ne: 'deleted' } }),
          ShopFollow.countDocuments({ shop: shop._id }),
        ]);

        return {
          ...shop,
          stats: {
            ...shop.stats,
            totalProducts,
            followerCount,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        shops: shopsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}

// POST /api/shops - Create shop
// Any authenticated user can create a shop; buyers become sellers when they do.
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const {
        shopName,
        description,
        about,
        tagline,
        category,
        shopSlug,
        logo,
        banner,
        avatar,
        coverImage,
        socialLinks,
        settings,
        policies,
      } = body;

      if (!shopName || !shopSlug) {
        return NextResponse.json(
          { success: false, message: 'Shop name and slug are required' },
          { status: 400 }
        );
      }

      await connectDB();

      // One shop per user: if they already have a shop (pending or active), block creation
      const existingShopByOwner = await Shop.findOne({ owner: user.userId });
      if (existingShopByOwner) {
        return NextResponse.json(
          {
            success: false,
            message: 'You can only set up one shop. Your shop is already registered and under review.',
            code: 'SHOP_ALREADY_EXISTS',
          },
          { status: 409 }
        );
      }

      // Check if slug is unique
      const existingShop = await Shop.findOne({ shopSlug: shopSlug.toLowerCase() });
      if (existingShop) {
        return NextResponse.json(
          { success: false, message: 'Shop slug already exists' },
          { status: 400 }
        );
      }

      // Check if user is already KYC approved to auto-activate the shop
      const isAutoApproved = user.kyc?.status === 'approved';

      const shop = await Shop.create({
        owner: user.userId,
        shopName,
        shopSlug: shopSlug.toLowerCase(),
        description,
        about,
        tagline,
        category,
        logo,
        banner,
        avatar: avatar || logo,
        coverImage: coverImage || banner,
        socialLinks,
        settings,
        policies,
        verification: {
          status: isAutoApproved ? 'verified' : 'pending',
          verifiedAt: isAutoApproved ? new Date() : undefined,
        },
        status: isAutoApproved ? 'active' : 'pending',
      });

      // Link shop to user and promote buyer → seller when they create a shop
      const updatePayload: { shop: typeof shop._id; role?: string } = { shop: shop._id };
      if (user.role === 'buyer') {
        updatePayload.role = 'seller';
      }
      const updatedUser = await User.findByIdAndUpdate(
        user.userId,
        { $set: updatePayload },
        { new: true }
      ).select('fullName email');

      // Notify all admins (in-app notification + email)
      const ownerName = updatedUser?.fullName || 'Unknown';
      const ownerEmail = updatedUser?.email || user.email;
      try {
        await notifyAdminsNewShop({
          shopId: shop._id.toString(),
          shopName: shop.shopName,
          shopSlug: shop.shopSlug,
          ownerName,
          ownerEmail,
        });
        await sendAdminNewShopEmail(shop.shopName, ownerName, ownerEmail);
      } catch (notifyErr: any) {
        console.error('Failed to notify admins of new shop:', notifyErr);
        // Don't fail the request; shop is already created
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Shop created successfully. It is now under review. You will not see the setup page again.',
          data: shop,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Create shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create shop' },
        { status: 500 }
      );
    }
  })(request);
}

