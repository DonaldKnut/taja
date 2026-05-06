import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/revenue — delivered/completed order revenue summary
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const limit = Math.min(50, Math.max(5, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));

      const [agg, recent] = await Promise.all([
        Order.aggregate([
          { $match: { isDeleted: { $ne: true }, status: { $in: ['delivered', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$totals.total' }, count: { $sum: 1 } } },
        ]),
        Order.find({ isDeleted: { $ne: true }, status: { $in: ['delivered', 'completed'] } })
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate('buyer', 'fullName email')
          .populate('shop', 'shopName shopSlug')
          .select('orderNumber totals status createdAt')
          .lean(),
      ]);

      const totalRevenue = agg[0]?.total || 0;
      const orderCount = agg[0]?.count || 0;

      return NextResponse.json({
        success: true,
        data: {
          summary: { totalRevenue, orderCount },
          recentOrders: recent,
        },
      });
    } catch (error: any) {
      console.error('GET admin overview revenue error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch revenue' },
        { status: 500 }
      );
    }
  })(request);
}
