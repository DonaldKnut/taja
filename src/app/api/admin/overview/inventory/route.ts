import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/inventory — paginated product catalogue for admin overview
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const search = (searchParams.get('search') || '').trim();
      const skip = (page - 1) * limit;

      const query: Record<string, unknown> = { status: { $ne: 'deleted' } };
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } },
        ];
      }

      const [items, total, totalAll] = await Promise.all([
        Product.find(query)
          .populate('shop', 'shopName shopSlug')
          .select('title slug price status images inventory createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(query),
        Product.countDocuments({ status: { $ne: 'deleted' } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: { totalProducts: totalAll },
          products: items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error: any) {
      console.error('GET admin overview inventory error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch inventory' },
        { status: 500 }
      );
    }
  })(request);
}
