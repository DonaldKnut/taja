import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import Category from '@/models/Category';
import User from '@/models/User';
import { authenticate } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/marketplace/feed - Get marketplace feed with products and recommendations
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Models are registered via imports above
    // User model is required for populate('seller') and populate('owner')

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const includeMine = searchParams.get('includeMine') === 'true';

    // Build query for active products (optionally include authenticated user's own non-deleted products)
    let query: any = { status: 'active' };
    if (includeMine) {
      const auth = await authenticate(request);
      const authUserId = auth.user?.userId;
      if (authUserId) {
        query = {
          $or: [
            { status: 'active' },
            { seller: authUserId, status: { $ne: 'deleted' } },
          ],
        };
      }
    }

    // If category is provided, find category by name or slug
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [
          { name: category },
          { slug: category.toLowerCase().replace(/\s+/g, '-') },
        ],
      });

      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // Fallback: try to match by name directly (for backward compatibility)
        query.category = category;
      }
    }

    // Get products
    const products = await Product.find(query)
      .populate('seller', 'fullName avatar')
      .populate('shop', 'shopName shopSlug logo banner avatar')
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Debug logging
    console.log(`[Marketplace Feed] Found ${products.length} products with query:`, JSON.stringify(query, null, 2));
    if (products.length === 0) {
      const totalProducts = await Product.countDocuments({});
      const activeProducts = await Product.countDocuments({ status: 'active' });
      console.log(`[Marketplace Feed] Total products in DB: ${totalProducts}, Active products: ${activeProducts}`);
    }

    // Get all categories for filter
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('name slug icon')
      .lean();

    // Get recommended shops (top shops by follower count and rating)
    const recommendedShops = await Shop.find({ status: 'active' })
      .populate('owner', 'fullName avatar')
      .sort({ 'stats.followerCount': -1, 'stats.averageRating': -1 })
      .limit(6)
      .select('shopName shopSlug logo banner description stats verification')
      .lean();

    // Transform products to match expected format
    const transformedProducts = products.map((product: any) => ({
      _id: product._id.toString(),
      id: product._id.toString(),
      slug: product.slug,
      title: product.title,
      description: product.description,
      longDescription: product.longDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images || [],
      category: product.category?.name || product.category || 'General',
      subcategory: product.subcategory,
      condition: product.condition,
      stock: product.inventory?.quantity || 0,
      seller: product.seller?._id?.toString() || product.seller?.toString(),
      shop: product.shop
        ? {
            _id: product.shop._id?.toString(),
            shopName: product.shop.shopName,
            shopSlug: product.shop.shopSlug,
            logo: product.shop.logo || product.shop.avatar,
            banner: product.shop.banner || product.shop.coverImage,
            isVerified: product.shop.verification?.status === 'verified',
            averageRating: product.shop.stats?.averageRating || 0,
          }
        : undefined,
      shopSlug: product.shop?.shopSlug,
      location: product.shop?.address?.city || 'Nigeria',
      averageRating: product.averageRating || 0,
      reviewCount: product.reviewCount || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    // Transform recommended shops
    const transformedShops = recommendedShops.map((shop: any) => ({
      _id: shop._id.toString(),
      shopName: shop.shopName,
      shopSlug: shop.shopSlug,
      logo: shop.logo,
      banner: shop.banner,
      description: shop.description,
      isVerified: shop.verification?.status === 'verified',
      averageRating: shop.stats?.averageRating || 0,
      followerCount: shop.stats?.followerCount || 0,
      totalProducts: shop.stats?.totalProducts || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
        recommendedShops: transformedShops,
        categories: categories.map((cat: any) => cat.name),
        savedFilters: [],
        personalizedHeadline: undefined,
        experimentVariant: 'control',
      },
    });
  } catch (error: any) {
    console.error('[Marketplace Feed] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return error response but don't fail completely - return empty data
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch marketplace feed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        data: {
          products: [],
          recommendedShops: [],
          categories: [],
          savedFilters: [],
          personalizedHeadline: undefined,
          experimentVariant: 'control',
        },
      },
      { status: 500 }
    );
  }
}
