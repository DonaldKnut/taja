import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Review from '@/models/Review';
import ShopFollow from '@/models/ShopFollow';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/shops/:shopId/analytics - Get shop analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const shop = await Shop.findById(params.shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      // Check if user owns the shop or is admin
      if (shop.owner.toString() !== user.userId && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Calculate dynamic stats
      const [totalProducts, totalOrders, totalRevenue, reviews, followerCount] = await Promise.all([
        Product.countDocuments({ shop: params.shopId, status: { $ne: 'deleted' } }),
        Order.countDocuments({ shop: params.shopId }),
        Order.aggregate([
          { $match: { shop: shop._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totals.total' } } },
        ]),
        Review.aggregate([
          { $match: { shop: shop._id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
        ]),
        ShopFollow.countDocuments({ shop: params.shopId }),
      ]);

      // Update shop stats dynamically
      const revenue = totalRevenue[0]?.total || 0;
      const reviewData = reviews[0] || { averageRating: 0, reviewCount: 0 };

      shop.stats.totalProducts = totalProducts;
      shop.stats.totalOrders = totalOrders;
      shop.stats.totalRevenue = revenue;
      shop.stats.averageRating = Math.round(reviewData.averageRating * 10) / 10;
      shop.stats.reviewCount = reviewData.reviewCount;
      shop.stats.followerCount = followerCount;
      await shop.save();

      // Get period-based analytics
      const searchParams = request.nextUrl.searchParams;
      const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y, all

      let dateFilter: any = {};
      if (period !== 'all') {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        dateFilter.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }

      const [periodOrders, periodRevenue] = await Promise.all([
        Order.countDocuments({ shop: params.shopId, ...dateFilter }),
        Order.aggregate([
          {
            $match: {
              shop: shop._id,
              paymentStatus: 'paid',
              ...dateFilter,
            },
          },
          { $group: { _id: null, total: { $sum: '$totals.total' } } },
        ]),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          stats: shop.stats,
          period: {
            orders: periodOrders,
            revenue: periodRevenue[0]?.total || 0,
          },
          shop: {
            _id: shop._id,
            shopName: shop.shopName,
            shopSlug: shop.shopSlug,
            status: shop.status,
            verification: shop.verification,
          },
        },
      });
    } catch (error: any) {
      console.error('Get shop analytics error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  })(request);
}








