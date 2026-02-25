import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import Order from '@/models/Order';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// POST /api/reviews - Create a review for a completed order
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const {
        orderId,
        shopId,
        productId,
        rating,
        title,
        comment,
      }: {
        orderId: string;
        shopId?: string;
        productId?: string;
        rating: number;
        title?: string;
        comment: string;
      } = body;

      if (!orderId || !rating || !comment) {
        return NextResponse.json(
          { success: false, message: 'orderId, rating and comment are required' },
          { status: 400 }
        );
      }

      // Verify order belongs to user and is delivered / completed
      const order = await Order.findById(orderId);

      if (!order) {
        return NextResponse.json(
          { success: false, message: 'Order not found' },
          { status: 404 }
        );
      }

      if (order.buyer.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: 'You can only review your own orders' },
          { status: 403 }
        );
      }

      if (order.status !== 'delivered') {
        return NextResponse.json(
          {
            success: false,
            message: 'You can only leave a review after the order is delivered',
          },
          { status: 400 }
        );
      }

      // Prevent duplicate review for the same order & shop
      const existingReview = await Review.findOne({
        reviewer: user.userId,
        order: order._id,
        shop: order.shop,
      });

      if (existingReview) {
        return NextResponse.json(
          { success: false, message: 'You have already reviewed this order' },
          { status: 400 }
        );
      }

      // Verify shop / product IDs when provided
      let resolvedShopId = shopId || (order.shop as any)?.toString();
      let resolvedProductId = productId;

      if (resolvedShopId) {
        const shopExists = await Shop.exists({ _id: resolvedShopId });
        if (!shopExists) resolvedShopId = undefined;
      }

      if (resolvedProductId) {
        const productExists = await Product.exists({ _id: resolvedProductId });
        if (!productExists) resolvedProductId = undefined;
      }

      const review = await Review.create({
        reviewer: user.userId,
        shop: resolvedShopId,
        product: resolvedProductId,
        order: order._id,
        rating,
        title,
        comment,
        verifiedPurchase: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
      });
    } catch (error: any) {
      console.error('Create review error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to submit review',
        },
        { status: 500 }
      );
    }
  })(request);
}






