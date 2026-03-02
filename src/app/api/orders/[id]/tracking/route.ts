import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/middleware';
import { sendOrderShippedEmail } from '@/lib/email';
import { notifyOrderUpdate } from '@/lib/notifications';
import { calculateAutoConfirmDate } from '@/lib/jobs/autoConfirmOrders';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/:id/tracking
 * Seller uploads tracking information
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
        trackingNumber,
        carrier,
        trackingUrl,
        estimatedDelivery,
        sellerNotes,
      } = body;

      if (!trackingNumber || !carrier) {
        return NextResponse.json(
          { success: false, message: 'Tracking number and carrier are required' },
          { status: 400 }
        );
      }

      const order = await Order.findById(params.id)
        .populate('buyer', 'fullName email')
        .populate('seller', 'fullName email')
        .populate('items.product', 'title images');

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Verify user is the seller
      if (order.seller._id.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Only the seller can upload tracking' },
          { status: 403 }
        );
      }

      // Verify order is paid and not already shipped
      if (order.paymentStatus !== 'paid') {
        return NextResponse.json(
          { success: false, message: 'Cannot ship unpaid order' },
          { status: 400 }
        );
      }

      if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
        return NextResponse.json(
          { success: false, message: 'Order already shipped' },
          { status: 400 }
        );
      }

      // Calculate auto-confirm date (7 days from now)
      const shippedAt = new Date();
      const autoConfirmAt = calculateAutoConfirmDate(shippedAt);

      // Update order with tracking info
      order.status = 'shipped';
      order.delivery = {
        ...order.delivery,
        trackingNumber,
        carrier,
        trackingUrl: trackingUrl || generateTrackingUrl(carrier, trackingNumber),
        shippedAt,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        autoConfirmAt,
        sellerNotes: sellerNotes || '',
      };
      order.buyerConfirmation = {
        status: 'pending',
      };

      await order.save();

      // Send email notification to buyer
      try {
        const buyer = order.buyer as any;
        const carrierLower = carrier.toLowerCase();
        const isKnownCarrier = ['gokada', 'kwik'].includes(carrierLower);
        
        await sendOrderShippedEmail(
          buyer.email,
          buyer.fullName,
          order.orderNumber,
          trackingNumber,
          (isKnownCarrier ? carrierLower : 'kwik') as 'gokada' | 'kwik',
          estimatedDelivery 
            ? new Date(estimatedDelivery).toLocaleDateString('en-NG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : '3-5 business days',
          order.items.map((item: any) => ({
            name: item.title || item.product?.title || 'Product',
            quantity: item.quantity,
            price: item.price,
          })),
          {
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
          },
          undefined, // driver info - not available for self-managed
          order._id.toString()
        );
      } catch (emailError) {
        console.error('Failed to send shipped email:', emailError);
        // Don't fail the request if email fails
      }

      // Send in-app notification to buyer
      await notifyOrderUpdate(
        order.buyer._id.toString(),
        order.orderNumber,
        'shipped',
        order._id.toString()
      );

      return NextResponse.json({
        success: true,
        message: 'Tracking information uploaded successfully',
        data: {
          orderId: order._id,
          status: order.status,
          trackingNumber: order.delivery.trackingNumber,
          carrier: order.delivery.carrier,
          trackingUrl: order.delivery.trackingUrl,
          shippedAt: order.delivery.shippedAt,
          estimatedDelivery: order.delivery.estimatedDelivery,
        },
      });
    } catch (error: any) {
      console.error('Upload tracking error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to upload tracking' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PUT /api/orders/:id/tracking
 * Update tracking information (if needed)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const order = await Order.findById(params.id);

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      // Verify user is the seller
      if (order.seller.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'Only the seller can update tracking' },
          { status: 403 }
        );
      }

      // Update allowed fields
      if (body.trackingNumber) order.delivery.trackingNumber = body.trackingNumber;
      if (body.carrier) order.delivery.carrier = body.carrier;
      if (body.trackingUrl) order.delivery.trackingUrl = body.trackingUrl;
      if (body.estimatedDelivery) order.delivery.estimatedDelivery = new Date(body.estimatedDelivery);
      if (body.sellerNotes !== undefined) order.delivery.sellerNotes = body.sellerNotes;

      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Tracking information updated',
        data: order.delivery,
      });
    } catch (error: any) {
      console.error('Update tracking error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update tracking' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * Generate tracking URL for common carriers
 */
function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierLower = carrier.toLowerCase();
  
  const trackingUrls: Record<string, string> = {
    'gokada': `https://gokada.ng/track/${trackingNumber}`,
    'kwik': `https://kwik.delivery/track/${trackingNumber}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}&brand=DHL`,
    'fedex': `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`,
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'aramex': `https://www.aramex.com/track?ShipmentNumber=${trackingNumber}`,
    'redstar': `https://redstarexpress.com/tracking/${trackingNumber}`,
    'peace': `https://peaceexpress.com/tracking/${trackingNumber}`,
    'gig': `https://giglogistics.com/tracking/${trackingNumber}`,
    'max': `https://max.ng/tracking/${trackingNumber}`,
  };

  return trackingUrls[carrierLower] || '#';
}
