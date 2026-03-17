import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// PATCH /api/orders/:id/status - Update order status (seller or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json(
          { success: false, message: 'Status is required' },
          { status: 400 }
        );
      }

      const allowed = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'completed',
        'cancelled',
        'refunded',
        'disputed',
      ];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status' },
          { status: 400 }
        );
      }

      await connectDB();

      const order = await Order.findOne({ _id: params.id, isDeleted: { $ne: true } });

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      const isSeller = order.seller.toString() === user.userId;
      const isAdmin = user.role === 'admin';

      if (!isSeller && !isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Only buyer or admin can set delivered (escrow safety)
      if (status === 'delivered' && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Only the buyer (or admin) can confirm delivery. Ask the buyer to confirm in their order page.',
            code: 'DELIVERY_CONFIRMATION_REQUIRED',
          },
          { status: 403 }
        );
      }

      order.status = status;
      const delivery = order.delivery as any;
      if (delivery) {
        if (status === 'shipped') {
          delivery.shippedAt = delivery.shippedAt || new Date();
        }
        if (status === 'delivered') {
          delivery.deliveredAt = new Date();
        }
      }
      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Order status updated',
        data: order,
      });
    } catch (error: any) {
      console.error('Update order status error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update order status' },
        { status: 500 }
      );
    }
  })(request);
}
