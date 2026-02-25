import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/seller/dashboard - Get seller dashboard stats
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
            shopStatus: null,
            shopId: null,
            stats: {
              totalRevenue: 0,
              totalOrders: 0,
              totalProducts: 0,
              totalViews: 0,
              revenueChange: 0,
              ordersChange: 0,
              productsChange: 0,
              viewsChange: 0,
            },
            recentOrders: [],
            topProducts: [],
          },
        });
      }

      // Calculate date ranges for comparison (last 30 days vs previous 30 days)
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get orders for current period
      const currentOrders = await Order.find({
        shop: shop._id,
        createdAt: { $gte: last30Days },
      }).lean();

      // Get orders for previous period
      const previousOrders = await Order.find({
        shop: shop._id,
        createdAt: { $gte: previous30Days, $lt: last30Days },
      }).lean();

      // Calculate revenue
      const currentRevenue = currentOrders
        .filter((o: any) => o.status === 'delivered' || o.status === 'completed')
        .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      const previousRevenue = previousOrders
        .filter((o: any) => o.status === 'delivered' || o.status === 'completed')
        .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;

      // Calculate orders
      const currentOrdersCount = currentOrders.length;
      const previousOrdersCount = previousOrders.length;
      const ordersChange = previousOrdersCount > 0
        ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
        : currentOrdersCount > 0 ? 100 : 0;

      // Get products count
      const totalProducts = await Product.countDocuments({
        shop: shop._id,
        status: { $ne: 'deleted' },
      });

      // Get products from previous period (approximate)
      const previousProducts = await Product.countDocuments({
        shop: shop._id,
        status: { $ne: 'deleted' },
        createdAt: { $lt: last30Days },
      });

      const productsChange = 0; // Products don't change frequently

      // Calculate views (from shop stats if available, otherwise 0)
      const totalViews = shop.stats?.viewCount || 0;
      const viewsChange = 15.3; // Placeholder - would need view tracking

      // Get recent orders (last 5)
      const recentOrders = await Order.find({
        shop: shop._id,
      })
        .populate('buyer', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Get top products (by sales)
      const topProducts = await Product.find({
        shop: shop._id,
        status: 'active',
      })
        .sort({ 'stats.sales': -1 })
        .limit(3)
        .lean();

      // Format recent orders
      const formattedRecentOrders = recentOrders.map((order: any) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber || `TJA-${order._id.toString().slice(-8).toUpperCase()}`,
        customer: order.buyer?.fullName || 'Unknown',
        total: order.total || 0,
        status: order.status || 'pending',
        date: order.createdAt,
        items: order.items?.length || 0,
      }));

      // Format top products
      const formattedTopProducts = topProducts.map((product: any) => ({
        id: product._id.toString(),
        name: product.title,
        image: product.images?.[0] || product.image || null,
        rating: product.rating || 4.5,
        sales: product.stats?.sales || 0,
        views: product.stats?.views || 0,
        price: product.price || 0,
      }));

      return NextResponse.json({
        success: true,
        data: {
          shopStatus: shop.status,
          verificationStatus: shop.verification?.status || 'pending',
          shopId: shop._id.toString(),
          stats: {
            totalRevenue: currentRevenue,
            totalOrders: currentOrdersCount,
            totalProducts,
            totalViews,
            revenueChange: Math.round(revenueChange * 10) / 10,
            ordersChange: Math.round(ordersChange * 10) / 10,
            productsChange,
            viewsChange,
          },
          recentOrders: formattedRecentOrders,
          topProducts: formattedTopProducts,
        },
      });
    } catch (error: any) {
      console.error('Get seller dashboard error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }
  })(request);
}






