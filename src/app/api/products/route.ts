import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireRole, authenticate } from '@/lib/middleware';
import { writeAuditLog } from '@/lib/audit';
import { validateShippingPolicy } from '@/lib/delivery/shippingPolicy';
import '@/models/Shop'; // ensure Shop model is registered for populate('shop')
import '@/models/User'; // ensure User model is registered for populate('seller')
import '@/models/Category'; // ensure Category model is registered for populate('category')

export const dynamic = 'force-dynamic';

const normalizeMediaUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  return null;
};

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const shopId = searchParams.get('shopId') || '';
    const condition = searchParams.get('condition') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeMine = searchParams.get('includeMine') === 'true';

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

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (shopId) {
      query.shop = shopId;
    }

    if (condition) {
      query.condition = condition;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'fullName avatar')
        .populate('shop', 'shopName shopSlug logo')
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  return requireRole(['seller', 'admin'])(async (req, user) => {
    try {
      const body = await request.json();
      const {
        title,
        description,
        longDescription,
        category,
        subcategory,
        condition,
        price,
        maxPrice,
        compareAtPrice,
        images,
        videos,
        inventory,
        shipping,
        specifications,
        seo,
        status = 'draft',
        shop,
        variants,
        isNegotiable,
      } = body;
      const normalizedImages = Array.isArray(images)
        ? images
            .map((img: unknown) => normalizeMediaUrl(img))
            .filter((img): img is string => Boolean(img))
            .slice(0, 8)
        : [];
      const normalizedVideos = Array.isArray(videos)
        ? videos
            .map((v: any) => {
              const normalizedUrl = normalizeMediaUrl(typeof v === 'string' ? v : v?.url);
              return normalizedUrl ? { ...(typeof v === 'object' && v ? v : {}), url: normalizedUrl, type: 'video' as const } : null;
            })
            .filter((v): v is { url: string; type: 'video' } => Boolean(v))
            .slice(0, 2)
        : [];
      if (Array.isArray(videos) && videos.length > 2) {
        return NextResponse.json(
          { success: false, message: 'Maximum 2 videos are allowed per product' },
          { status: 400 }
        );
      }

      if (!title || !description || !category || !price || normalizedImages.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      if (status !== 'draft') {
        const shippingValidation = validateShippingPolicy(shipping);
        if (!shippingValidation.isValid) {
          return NextResponse.json(
            { success: false, message: shippingValidation.message || 'Invalid shipping policy' },
            { status: 400 }
          );
        }
      }

      await connectDB();

      // Resolve Category ID if name is provided instead of ObjectId
      let finalCategoryId = category;
      const { default: Category } = await import('@/models/Category');
      const mongoose = (await import('mongoose')).default;

      if (!mongoose.Types.ObjectId.isValid(category)) {
        const foundCategory = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
          ]
        });

        if (foundCategory) {
          finalCategoryId = foundCategory._id;
        } else {
          // Fallback: If category doesn't exist, we might want to create a general one or return error
          // For now, let's return error to keep it clean, but we could also use a "General" fallback
          return NextResponse.json(
            { success: false, message: `Category '${category}' not found.` },
            { status: 400 }
          );
        }
      }

      // Enforce Shop Existence
      const Shop = (await import('@/models/Shop')).default;
      const userShop = await Shop.findOne({ owner: user.userId });

      if (!userShop) {
        return NextResponse.json(
          {
            success: false,
            message: 'You must create a shop before adding products. Please go to Seller Center > Shop Setup.',
            code: 'SHOP_REQUIRED'
          },
          { status: 403 }
        );
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug is unique
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        const uniqueSlug = `${slug}-${Date.now()}`;
        // Use unique slug
      }

      const product = await Product.create({
        seller: user.userId,
        shop: userShop._id,
        title,
        slug: existingProduct ? `${slug}-${Date.now()}` : slug,
        description,
        longDescription,
        category: finalCategoryId,
        subcategory,
        condition: condition || 'new',
        price,
        maxPrice,
        compareAtPrice,
        images: normalizedImages,
        videos: normalizedVideos,
        inventory: {
          quantity: inventory?.quantity || 0,
          sku: inventory?.sku,
          trackQuantity: inventory?.trackQuantity !== false,
          moq: inventory?.moq ?? 1,
        },
        shipping: {
          weight: shipping?.weight || 0,
          dimensions: shipping?.dimensions || { length: 0, width: 0, height: 0 },
          freeShipping: shipping?.freeShipping || false,
          shippingCost: shipping?.shippingCost || 0,
          costPerKg: shipping?.costPerKg,
          shippingPayer: shipping?.shippingPayer || 'buyer',
          weightTiers: shipping?.weightTiers,
          lagosMainlandDelivery:
            shipping?.lagosMainlandDelivery != null && Number.isFinite(Number(shipping.lagosMainlandDelivery))
              ? Number(shipping.lagosMainlandDelivery)
              : undefined,
          lagosIslandDelivery:
            shipping?.lagosIslandDelivery != null && Number.isFinite(Number(shipping.lagosIslandDelivery))
              ? Number(shipping.lagosIslandDelivery)
              : undefined,
          processingTime: shipping?.processingTime || '3-5-days',
        },
        specifications: specifications || {},
        seo: seo || { tags: [] },
        status,
        variants: variants || [],
        isNegotiable: isNegotiable || false,
      });

      await writeAuditLog({
        request,
        actorUserId: user.userId,
        actorRole: user.role,
        action: 'product.create',
        entityType: 'product',
        entityId: String(product._id),
        metadata: {
          shopId: String(userShop._id),
          title: product.title,
          status: product.status,
          imageCount: Array.isArray(product.images) ? product.images.length : 0,
          videoCount: Array.isArray((product as any).videos) ? (product as any).videos.length : 0,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Product created successfully',
          data: product,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Create product error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create product' },
        { status: 500 }
      );
    }
  })(request);
}








