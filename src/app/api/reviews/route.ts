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

// GET /api/reviews - Get reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const shopId = searchParams.get('shopId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (productId) query.product = productId;
    if (shopId) query.shop = shopId;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'fullName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);

    // Calculate overall average rating
    const stats = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          count: { $sum: 1 },
          distribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats[0]?.distribution) {
      stats[0].distribution.forEach((r: number) => {
        const rounded = Math.round(r);
        if (rounded >= 1 && rounded <= 5) {
          distribution[rounded as keyof typeof distribution]++;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: stats[0]?.averageRating || 0,
          totalCount: total,
          distribution
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}






