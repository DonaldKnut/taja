import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/disputes
 * List all disputes with filtering
 */
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || 'open';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

      const query: any = {
        $or: [
          { 'dispute.status': status },
          { status: 'disputed' },
        ],
      };

      if (status !== 'all') {
        query['dispute.status'] = status;
      }

      const skip = (page - 1) * limit;

      const [disputes, total] = await Promise.all([
        Order.find(query)
          .select('orderNumber buyer seller shop items totals dispute buyerConfirmation delivery createdAt')
          .populate('buyer', 'fullName email phone')
          .populate('seller', 'fullName email phone')
          .populate('shop', 'shopName')
          .sort({ 'dispute.openedAt': -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          disputes,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('List disputes error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to list disputes' },
        { status: 500 }
      );
    }
  })(request);
}
