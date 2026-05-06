import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/orders-held — paginated orders with escrow still held
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;
      const search = (request.nextUrl.searchParams.get('search') || '').trim();

      const matchQuery: Record<string, unknown> = {
        isDeleted: { $ne: true },
        escrowStatus: 'funded',
        'escrowHold.status': 'held',
      };
      if (search) {
        matchQuery.orderNumber = { $regex: search, $options: 'i' };
      }

      const [orders, total] = await Promise.all([
        Order.find(matchQuery)
          .populate('buyer', 'fullName email')
          .populate('seller', 'fullName email')
          .populate('shop', 'shopName shopSlug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(matchQuery),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          orders,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error: any) {
      console.error('GET admin overview orders-held error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch held orders' },
        { status: 500 }
      );
    }
  })(request);
}
