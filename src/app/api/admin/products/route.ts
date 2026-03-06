import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/products - Get all products with filters
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const category = searchParams.get('category');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search');

      // Build query
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        // To search by seller or shop name, we first find matching users/shops
        const [matchingUsers, matchingShops] = await Promise.all([
          import('@/models/User').then(m => m.default.find({ fullName: { $regex: search, $options: 'i' } }).select('_id').lean()),
          import('@/models/Shop').then(m => m.default.find({ shopName: { $regex: search, $options: 'i' } }).select('_id').lean())
        ]);

        const userIds = matchingUsers.map(u => u._id);
        const shopIds = matchingShops.map(s => s._id);

        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          ...(userIds.length ? [{ seller: { $in: userIds } }] : []),
          ...(shopIds.length ? [{ shop: { $in: shopIds } }] : [])
        ];
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('seller', 'fullName email')
          .populate('shop', 'shopName shopSlug')
          .sort({ createdAt: -1 })
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
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('Get admin products error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch products' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/admin/products - Create product on behalf of a shop (admin only)
export async function POST(request: NextRequest) {
  return requireRole(['admin'])(async (req, adminUser) => {
    try {
      const body = await request.json();
      const {
        shopId,
        title,
        description,
        longDescription,
        category,
        subcategory,
        condition,
        price,
        compareAtPrice,
        images,
        inventory,
        shipping,
        specifications,
        seo,
        status = 'active',
      } = body;

      if (!shopId || !title || !description || !category || price == null || !images?.length) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields: shopId, title, description, category, price, images' },
          { status: 400 }
        );
      }

      await connectDB();

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const existingProduct = await Product.findOne({ slug });
      const finalSlug = existingProduct ? `${slug}-${Date.now()}` : slug;

      const product = await Product.create({
        seller: shop.owner,
        shop: shop._id,
        title,
        slug: finalSlug,
        description,
        longDescription: longDescription || undefined,
        category,
        subcategory: subcategory || undefined,
        condition: condition || 'new',
        price: Number(price),
        compareAtPrice: compareAtPrice != null ? Number(compareAtPrice) : undefined,
        images,
        inventory: {
          quantity: inventory?.quantity ?? 0,
          sku: inventory?.sku,
          trackQuantity: inventory?.trackQuantity !== false,
        },
        shipping: {
          weight: shipping?.weight ?? 0,
          dimensions: shipping?.dimensions ?? { length: 0, width: 0, height: 0 },
          freeShipping: shipping?.freeShipping ?? false,
          shippingCost: shipping?.shippingCost ?? 0,
          processingTime: shipping?.processingTime ?? '3-5-days',
        },
        specifications: specifications || {},
        seo: seo || { tags: [] },
        status: status === 'draft' ? 'draft' : 'active',
      });

      return NextResponse.json({
        success: true,
        message: 'Product created successfully',
        data: product,
      }, { status: 201 });
    } catch (error: any) {
      console.error('Admin create product error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create product' },
        { status: 500 }
      );
    }
  })(request);
}
