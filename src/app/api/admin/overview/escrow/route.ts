import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/escrow — held funds summary + sample of held orders
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const sample = Math.min(20, Math.max(5, parseInt(request.nextUrl.searchParams.get('sample') || '10', 10)));

      const [heldAgg, releasedAgg, heldOrders] = await Promise.all([
        Order.aggregate([
          {
            $match: {
              isDeleted: { $ne: true },
              escrowStatus: 'funded',
              'escrowHold.status': 'held',
            },
          },
          { $group: { _id: null, amount: { $sum: '$escrowHold.amount' }, count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { isDeleted: { $ne: true }, escrowStatus: 'released' } },
          { $group: { _id: null, amount: { $sum: '$escrowHold.sellerAmount' } } },
        ]),
        Order.find({
          isDeleted: { $ne: true },
          escrowStatus: 'funded',
          'escrowHold.status': 'held',
        })
          .sort({ createdAt: -1 })
          .limit(sample)
          .populate('buyer', 'fullName email')
          .populate('shop', 'shopName shopSlug')
          .select('orderNumber totals escrowHold createdAt status')
          .lean(),
      ]);

      const heldAmount = heldAgg[0]?.amount || 0;
      const ordersHeldCount = heldAgg[0]?.count || 0;
      const releasedAmount = releasedAgg[0]?.amount || 0;

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            heldAmount,
            ordersHeldCount,
            releasedAmount,
          },
          heldOrders,
        },
      });
    } catch (error: any) {
      console.error('GET admin overview escrow error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch escrow overview' },
        { status: 500 }
      );
    }
  })(request);
}
