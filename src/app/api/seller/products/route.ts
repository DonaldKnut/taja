import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/seller/products - Get seller's products
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const searchParams = req.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const category = searchParams.get('category') || '';

      // Build query - filter by seller
      const query: any = {
        seller: user.userId,
      };

      // Filter by status if provided and not 'all'
      if (status && status !== 'all') {
        query.status = status;
      } else {
        // If no status filter or 'all', exclude deleted products
        query.status = { $ne: 'deleted' };
      }

      // Filter by category if provided
      if (category && category !== 'all') {
        query.category = category;
      }

      // Text search
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('category', 'name slug')
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
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('Get seller products error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch products' },
        { status: 500 }
      );
    }
  })(request);
}






