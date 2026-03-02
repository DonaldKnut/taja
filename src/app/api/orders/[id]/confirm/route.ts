import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/middleware';
import { releaseEscrowToSeller } from '@/lib/payments/escrow';
import { notifyOrderUpdate, notifyPaymentUpdate } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/:id/confirm
 * Buyer confirms receipt of order - triggers escrow release
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const { rating, review } = body;

      const order = await Order.findById(params.id)
        .populate('buyer', 'fullName email')
        .populate('seller', 'fullName email');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Verify user is the buyer
      if (order.buyer._id.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Only the buyer can confirm receipt' },
          { status: 403 }
        );
      }

      // Verify order is shipped
      if (order.status !== 'shipped') {
        return NextResponse.json(
          { success: false, message: 'Order must be shipped before confirming' },
          { status: 400 }
        );
      }

      // Check if already confirmed
      if (order.buyerConfirmation?.status === 'confirmed' || order.buyerConfirmation?.status === 'auto_confirmed') {
        return NextResponse.json(
          { success: false, message: 'Order already confirmed' },
          { status: 400 }
        );
      }

      // Update order status
      order.status = 'completed';
      order.delivery.deliveredAt = new Date();
      order.delivery.buyerConfirmedAt = new Date();
      order.buyerConfirmation = {
        status: 'confirmed',
        confirmedAt: new Date(),
      };

      await order.save();

      // Release escrow to seller
      let escrowReleased = false;
      try {
        await releaseEscrowToSeller(order._id.toString());
        order.escrowStatus = 'released';
        await order.save();
        escrowReleased = true;

        // Notify seller
        await notifyPaymentUpdate(
          order.seller._id.toString(),
          order.orderNumber,
          'paid',
          order._id.toString()
        );
      } catch (escrowError) {
        console.error('Failed to release escrow:', escrowError);
        // Order is confirmed but escrow release failed - needs manual intervention
      }

      // Notify seller of confirmation
      await notifyOrderUpdate(
        order.seller._id.toString(),
        order.orderNumber,
        'completed',
        order._id.toString()
      );

      return NextResponse.json({
        success: true,
        message: 'Order confirmed successfully',
        data: {
          orderId: order._id,
          status: order.status,
          confirmedAt: order.delivery.buyerConfirmedAt,
          escrowReleased,
        },
      });
    } catch (error: any) {
      console.error('Confirm order error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to confirm order' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/orders/:id/confirm/status
 * Get confirmation status and time remaining for auto-confirm
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const order = await Order.findById(params.id)
        .select('status delivery buyerConfirmation buyer seller');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Verify user is buyer or seller
      const isBuyer = order.buyer.toString() === user.userId;
      const isSeller = order.seller.toString() === user.userId;

      if (!isBuyer && !isSeller) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Calculate time remaining for auto-confirm
      let timeRemaining = null;
      if (order.buyerConfirmation?.status === 'pending' && order.delivery?.autoConfirmAt) {
        const now = new Date();
        const autoConfirmDate = new Date(order.delivery.autoConfirmAt);
        if (autoConfirmDate > now) {
          const diffMs = autoConfirmDate.getTime() - now.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          timeRemaining = {
            days: diffDays,
            hours: diffHours,
            totalHours: Math.floor(diffMs / (1000 * 60 * 60)),
          };
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          status: order.status,
          confirmationStatus: order.buyerConfirmation?.status || 'pending',
          confirmedAt: order.buyerConfirmation?.confirmedAt,
          autoConfirmAt: order.delivery?.autoConfirmAt,
          timeRemaining,
          canConfirm: isBuyer && order.status === 'shipped',
        },
      });
    } catch (error: any) {
      console.error('Get confirmation status error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get status' },
        { status: 500 }
      );
    }
  })(request);
}
