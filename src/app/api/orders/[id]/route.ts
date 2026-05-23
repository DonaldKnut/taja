import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid order id' },
          { status: 400 }
        );
      }

      await connectDB();

      const order = await Order.findOne({ _id: params.id, isDeleted: { $ne: true } })
        .populate('buyer', 'fullName email phone avatar')
        .populate('seller', 'fullName email phone avatar')
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
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid order id' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json(
          { success: false, message: 'Status is required' },
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
      if (status === 'shipped' && order.delivery) {
        (order.delivery as any).shippedAt = (order.delivery as any).shippedAt || new Date();
      }
      if (status === 'delivered' && order.delivery) {
        (order.delivery as any).deliveredAt = new Date();
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

// DELETE /api/orders/:id - Soft delete (seller or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid order id' },
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

      (order as any).isDeleted = true;
      (order as any).deletedAt = new Date();
      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Order deleted',
      });
    } catch (error: any) {
      console.error('Delete order error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete order' },
        { status: 500 }
      );
    }
  })(request);
}





