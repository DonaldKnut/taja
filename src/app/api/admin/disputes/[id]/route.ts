import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/middleware';
import { refundEscrowToBuyer } from '@/lib/payments/escrow';
import { releaseEscrowToSeller } from '@/lib/payments/escrow';
import { notifyOrderUpdate, notifyPaymentUpdate } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/disputes/:id
 * Get single dispute details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const order = await Order.findById(params.id)
        .populate('buyer', 'fullName email phone')
        .populate('seller', 'fullName email phone')
        .populate('shop', 'shopName')
        .populate('dispute.openedBy', 'fullName')
        .populate('dispute.adminId', 'fullName');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
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
        data: order,
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

/**
 * PUT /api/admin/disputes/:id
 * Update dispute status or resolve
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const { action, notes, resolution } = body;

      const order = await Order.findById(params.id)
        .populate('buyer', 'fullName email')
        .populate('seller', 'fullName email');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      if (!order.dispute) {
        return NextResponse.json(
          { success: false, message: 'No dispute for this order' },
          { status: 404 }
        );
      }

      // Update dispute status
      if (action === 'take_under_review') {
        order.dispute.status = 'under_review';
        order.dispute.adminId = new (await import('mongoose')).Types.ObjectId(user.userId);
        order.dispute.adminNotes = notes || order.dispute.adminNotes;
      } else if (action === 'resolve') {
        // Validate resolution
        if (!resolution || !resolution.decision) {
          return NextResponse.json(
            { success: false, message: 'Resolution decision is required' },
            { status: 400 }
          );
        }

        const validDecisions = ['full_refund', 'partial_refund', 'no_refund', 'reship'];
        if (!validDecisions.includes(resolution.decision)) {
          return NextResponse.json(
            { success: false, message: 'Invalid resolution decision' },
            { status: 400 }
          );
        }

        // Process resolution
        let escrowProcessed = false;
        
        try {
          if (resolution.decision === 'full_refund') {
            await refundEscrowToBuyer(order._id.toString(), 'Dispute resolved: Full refund to buyer');
            order.escrowStatus = 'refunded';
            order.paymentStatus = 'refunded';
            order.status = 'refunded';
            
            // Notify buyer of refund
            await notifyPaymentUpdate(
              order.buyer._id.toString(),
              order.orderNumber,
              'refunded',
              order._id.toString()
            );
          } else if (resolution.decision === 'partial_refund') {
            const refundAmount = resolution.refundAmount || order.totals.total / 2;
            await refundEscrowToBuyer(order._id.toString(), `Dispute resolved: Partial refund ₦${refundAmount}`);
            // Release remaining to seller
            await releaseEscrowToSeller(order._id.toString());
            order.escrowStatus = 'released';
            order.status = 'completed';
          } else if (resolution.decision === 'no_refund') {
            await releaseEscrowToSeller(order._id.toString());
            order.escrowStatus = 'released';
            order.status = 'completed';
            
            // Notify seller
            await notifyPaymentUpdate(
              order.seller._id.toString(),
              order.orderNumber,
              'paid',
              order._id.toString()
            );
          } else if (resolution.decision === 'reship') {
            // Seller must reship - escrow remains held
            order.status = 'processing';
            order.dispute.resolution = {
              decision: resolution.decision,
              notes: resolution.notes || 'Seller must reship item',
              resolvedAt: new Date(),
            };
          }

          escrowProcessed = true;
        } catch (escrowError) {
          console.error('Escrow processing error:', escrowError);
          // Continue to save dispute resolution even if escrow fails
        }

        // Update dispute
        order.dispute.status = resolution.decision === 'partial_refund' 
          ? 'resolved_split' 
          : resolution.decision === 'full_refund' 
            ? 'resolved_buyer' 
            : 'resolved_seller';
        order.dispute.adminId = new (await import('mongoose')).Types.ObjectId(user.userId);
        order.dispute.adminNotes = notes || order.dispute.adminNotes;
        order.dispute.resolution = {
          decision: resolution.decision,
          refundAmount: resolution.refundAmount,
          notes: resolution.notes || '',
          resolvedAt: new Date(),
        };

        // Update buyer confirmation
        order.buyerConfirmation.status = 'confirmed';
        order.buyerConfirmation.confirmedAt = new Date();

        // Notify both parties
        await notifyOrderUpdate(
          order.buyer._id.toString(),
          order.orderNumber,
          order.status,
          order._id.toString()
        );
        await notifyOrderUpdate(
          order.seller._id.toString(),
          order.orderNumber,
          order.status,
          order._id.toString()
        );
      }

      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Dispute updated successfully',
        data: {
          orderId: order._id,
          dispute: order.dispute,
          status: order.status,
        },
      });
    } catch (error: any) {
      console.error('Update dispute error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update dispute' },
        { status: 500 }
      );
    }
  })(request);
}
