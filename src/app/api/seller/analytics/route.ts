import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import Review from '@/models/Review';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/seller/analytics - Get seller analytics
export async function GET(request: NextRequest) {
  return requireRole(['seller', 'admin'])(async (req, user) => {
    try {
      await connectDB();

      // Get user's shop
      const shop = await Shop.findOne({ owner: user.userId });
      if (!shop) {
        return NextResponse.json({
          success: true,
          data: {
            stats: {
              totalRevenue: 0,
              totalOrders: 0,
              totalProducts: 0,
              averageRating: 0,
              reviewCount: 0,
              followerCount: 0,
            },
            period: {
              orders: 0,
              revenue: 0,
            },
            charts: {
              revenueByDay: [],
              ordersByDay: [],
              topProducts: [],
              ordersByStatus: [],
              revenueByPaymentMethod: [],
            },
          },
        });
      }

      const searchParams = request.nextUrl.searchParams;
      const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y, all

      // Calculate date range
      let dateFilter: any = {};
      let days = 30;
      if (period === '7d') days = 7;
      else if (period === '30d') days = 30;
      else if (period === '90d') days = 90;
      else if (period === '1y') days = 365;
      else days = 0; // all

      if (days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter.createdAt = { $gte: startDate };
      }

      // Get all orders for the shop
      const allOrders = await Order.find({
        shop: shop._id,
        ...dateFilter,
      })
        .populate('buyer', 'fullName email')
        .lean();

      // Calculate stats
      const totalOrders = allOrders.length;
      const paidOrders = allOrders.filter((o: any) => o.paymentStatus === 'paid');
      const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.totals?.total || 0), 0);
      const totalProducts = await Product.countDocuments({
        shop: shop._id,
        status: { $ne: 'deleted' },
      });

      // Get reviews
      const reviews = await Review.find({ shop: shop._id }).lean();
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      // Revenue and orders by day (for charts)
      const revenueByDay: Array<{ date: string; revenue: number }> = [];
      const ordersByDay: Array<{ date: string; orders: number }> = [];
      
      if (days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const dayOrders = allOrders.filter((o: any) => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
          });

          const dayRevenue = dayOrders
            .filter((o: any) => o.paymentStatus === 'paid')
            .reduce((sum: number, o: any) => sum + (o.totals?.total || 0), 0);

          revenueByDay.push({
            date: date.toISOString().split('T')[0],
            revenue: dayRevenue,
          });

          ordersByDay.push({
            date: date.toISOString().split('T')[0],
            orders: dayOrders.length,
          });
        }
      }

      // Top products by revenue
      const productRevenue: Record<string, { name: string; revenue: number; orders: number; image?: string }> = {};
      
      allOrders.forEach((order: any) => {
        if (order.paymentStatus === 'paid' && order.items) {
          order.items.forEach((item: any) => {
            const productId = item.product?.toString() || 'unknown';
            if (!productRevenue[productId]) {
              productRevenue[productId] = {
                name: item.title || 'Unknown Product',
                revenue: 0,
                orders: 0,
                image: item.image,
              };
            }
            productRevenue[productId].revenue += (item.price || 0) * (item.quantity || 0);
            productRevenue[productId].orders += 1;
          });
        }
      });

      const topProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Orders by status
      const statusCounts: Record<string, number> = {};
      allOrders.forEach((order: any) => {
        const status = order.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Revenue by payment method
      const paymentMethodRevenue: Record<string, number> = {};
      paidOrders.forEach((order: any) => {
        const method = order.paymentMethod || 'unknown';
        paymentMethodRevenue[method] = (paymentMethodRevenue[method] || 0) + (order.totals?.total || 0);
      });

      const revenueByPaymentMethod = Object.entries(paymentMethodRevenue).map(([method, revenue]) => ({
        method,
        revenue,
      }));

      // Calculate period-over-period change
      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

      const previousOrders = await Order.find({
        shop: shop._id,
        createdAt: { $gte: previousPeriodStart, $lt: previousPeriodEnd },
      }).lean();

      const previousRevenue = previousOrders
        .filter((o: any) => o.paymentStatus === 'paid')
        .reduce((sum: number, o: any) => sum + (o.totals?.total || 0), 0);

      const revenueChange = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0 ? 100 : 0;

      const ordersChange = previousOrders.length > 0
        ? ((totalOrders - previousOrders.length) / previousOrders.length) * 100
        : totalOrders > 0 ? 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          stats: {
            totalRevenue,
            totalOrders,
            totalProducts,
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length,
            followerCount: shop.stats?.followerCount || 0,
            revenueChange: Math.round(revenueChange * 10) / 10,
            ordersChange: Math.round(ordersChange * 10) / 10,
          },
          period: {
            orders: totalOrders,
            revenue: totalRevenue,
          },
          charts: {
            revenueByDay,
            ordersByDay,
            topProducts,
            ordersByStatus,
            revenueByPaymentMethod,
          },
          shop: {
            _id: shop._id,
            shopName: shop.shopName,
            shopSlug: shop.shopSlug,
          },
        },
      });
    } catch (error: any) {
      console.error('Get seller analytics error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  })(request);
}







