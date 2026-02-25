import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/orders/:id - Get order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const order = await Order.findById(params.id)
        .populate('buyer', 'fullName email phone')
        .populate('seller', 'fullName email phone')
        .populate('shop', 'shopName shopSlug logo')
        .populate('items.product')
        .lean();

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Check if user is buyer, seller, or admin
      const isBuyer = order.buyer.toString() === user.userId;
      const isSeller = order.seller.toString() === user.userId;
      const isAdmin = user.role === 'admin';

      if (!isBuyer && !isSeller && !isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error('Get order error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch order' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/orders/:id/status - Update order status
export async function PUT(
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

      await connectDB();

      const order = await Order.findById(params.id);

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Check permissions
      const isSeller = order.seller.toString() === user.userId;
      const isAdmin = user.role === 'admin';

      if (!isSeller && !isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Prevent seller from self-marking as delivered (escrow safety)
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
      if (status === 'delivered') {
        order.delivery.deliveredAt = new Date();
      }
      await order.save();

      // TODO: Emit Socket.IO event for order status update
      // if (io) {
      //   io.emitToOrder(order._id.toString(), 'order_status_update', { orderId: order._id, status });
      // }

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








