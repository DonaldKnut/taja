import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats - Get platform statistics
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const [
        totalUsers,
        totalSellers,
        totalBuyers,
        totalShops,
        totalProducts,
        pendingKyc,
        pendingShops,
        activeUsers,
        bannedUsers,
        suspendedUsers,
        totalOrders,
        totalRevenue,
        escrowHeldAgg,
        escrowReleasedAgg,
        ordersHeldCount,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'seller' }),
        User.countDocuments({ role: 'buyer' }),
        Shop.countDocuments(),
        Product.countDocuments(),
        User.countDocuments({ 'kyc.status': 'pending', role: 'seller' }),
        Shop.countDocuments({ status: 'pending' }),
        User.countDocuments({ accountStatus: 'active' }),
        User.countDocuments({ accountStatus: 'banned' }),
        User.countDocuments({ accountStatus: 'suspended' }),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: { $in: ['delivered'] } } },
          { $group: { _id: null, total: { $sum: '$totals.total' } } },
        ]),
        Order.aggregate([
          { $match: { escrowStatus: 'funded', 'escrowHold.status': 'held' } },
          { $group: { _id: null, total: { $sum: '$escrowHold.amount' } } },
        ]),
        Order.aggregate([
          { $match: { escrowStatus: 'released' } },
          { $group: { _id: null, total: { $sum: '$escrowHold.sellerAmount' } } },
        ]),
        Order.countDocuments({ escrowStatus: 'funded', 'escrowHold.status': 'held' }),
      ]);

      // Calculate revenue and escrow
      const revenue = totalRevenue[0]?.total || 0;
      const escrowHeld = escrowHeldAgg[0]?.total || 0;
      const escrowReleased = escrowReleasedAgg[0]?.total || 0;

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });

      return NextResponse.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            sellers: totalSellers,
            buyers: totalBuyers,
            active: activeUsers,
            banned: bannedUsers,
            suspended: suspendedUsers,
            recent: recentUsers,
          },
          shops: {
            total: totalShops,
            pending: pendingShops,
          },
          products: {
            total: totalProducts,
          },
          kyc: {
            pending: pendingKyc,
          },
          orders: {
            total: totalOrders,
          },
          revenue: {
            total: revenue,
          },
          escrow: {
            heldAmount: escrowHeld,
            releasedAmount: escrowReleased,
            ordersHeldCount,
          },
        },
      });
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch stats' },
        { status: 500 }
      );
    }
  })(request);
}







