import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/middleware';
import { notifyOrderUpdate } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/:id/dispute
 * Buyer opens a dispute
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const {
        reason,
        description,
        evidence, // array of image URLs
      } = body;

      if (!reason || !description) {
        return NextResponse.json(
          { success: false, message: 'Reason and description are required' },
          { status: 400 }
        );
      }

      const validReasons = ['not_received', 'damaged', 'wrong_item', 'not_as_described', 'other'];
      if (!validReasons.includes(reason)) {
        return NextResponse.json(
          { success: false, message: 'Invalid dispute reason' },
          { status: 400 }
        );
      }

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
          { success: false, message: 'Only the buyer can open a dispute' },
          { status: 403 }
        );
      }

      // Verify order is shipped but not completed/cancelled/refunded
      if (!['shipped', 'delivered'].includes(order.status)) {
        return NextResponse.json(
          { success: false, message: 'Can only dispute shipped orders' },
          { status: 400 }
        );
      }

      // Check if dispute already exists
      if (order.dispute?.status === 'open' || order.dispute?.status === 'under_review') {
        return NextResponse.json(
          { success: false, message: 'Dispute already open for this order' },
          { status: 400 }
        );
      }

      // Check if buyer already confirmed (can't dispute after confirming)
      if (order.buyerConfirmation?.status === 'confirmed') {
        return NextResponse.json(
          { success: false, message: 'Cannot dispute after confirming receipt' },
          { status: 400 }
        );
      }

      // Create dispute
      order.status = 'disputed';
      order.buyerConfirmation = {
        status: 'disputed',
        disputedAt: new Date(),
        disputeReason: reason,
        disputeDescription: description,
        disputeEvidence: evidence || [],
      };
      order.dispute = {
        openedAt: new Date(),
        openedBy: order.buyer._id,
        reason,
        description,
        evidence: evidence || [],
        status: 'open',
      };

      await order.save();

      // Notify seller
      await notifyOrderUpdate(
        order.seller._id.toString(),
        order.orderNumber,
        'disputed',
        order._id.toString()
      );

      // TODO: Notify admins of new dispute

      return NextResponse.json({
        success: true,
        message: 'Dispute opened successfully',
        data: {
          orderId: order._id,
          status: order.status,
          dispute: {
            openedAt: order.dispute.openedAt,
            reason: order.dispute.reason,
            status: order.dispute.status,
          },
        },
      });
    } catch (error: any) {
      console.error('Open dispute error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to open dispute' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/orders/:id/dispute
 * Get dispute details (buyer, seller, or admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const order = await Order.findById(params.id)
        .select('dispute buyerConfirmation buyer seller status')
        .populate('dispute.openedBy', 'fullName')
        .populate('dispute.adminId', 'fullName');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Verify user is buyer, seller, or admin
      const isBuyer = order.buyer.toString() === user.userId;
      const isSeller = order.seller.toString() === user.userId;
      const isAdmin = user.role === 'admin';

      if (!isBuyer && !isSeller && !isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      if (!order.dispute) {
        return NextResponse.json(
          { success: false, message: 'No dispute for this order' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          dispute: order.dispute,
          buyerConfirmation: order.buyerConfirmation,
        },
      });
    } catch (error: any) {
      console.error('Get dispute error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get dispute' },
        { status: 500 }
      );
    }
  })(request);
}
