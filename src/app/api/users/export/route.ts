import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/users/export - Export all user data (GDPR compliance)
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const userDoc = await User.findById(user.userId)
        .select('-password -refreshTokens -emailVerificationCode -phoneVerificationCode');

      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Fetch all user-related data
      const [orders, cart] = await Promise.all([
        Order.find({ buyer: user.userId })
          .populate('shop', 'shopName shopSlug')
          .populate('items.product', 'name title images')
          .sort({ createdAt: -1 })
          .lean(),
        Cart.findOne({ user: user.userId })
          .populate('items.product', 'name title images price')
          .lean(),
      ]);

      // Compile user data export
      const exportData = {
        profile: {
          fullName: userDoc.fullName,
          email: userDoc.email,
          phone: userDoc.phone,
          role: userDoc.role,
          avatar: userDoc.avatar,
          accountStatus: userDoc.accountStatus,
          emailVerified: userDoc.emailVerified,
          phoneVerified: userDoc.phoneVerified,
          addresses: userDoc.addresses,
          preferences: userDoc.preferences,
          createdAt: userDoc.createdAt,
          updatedAt: userDoc.updatedAt,
        },
        orders: orders.map((order: any) => ({
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          items: order.items,
          totals: order.totals,
          shippingAddress: order.shippingAddress,
          delivery: order.delivery,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
        cart: cart ? {
          items: cart.items,
          totals: cart.totals,
          updatedAt: cart.updatedAt,
        } : null,
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
      };

      // Return as JSON (can be downloaded as file)
      return NextResponse.json(
        {
          success: true,
          message: 'Data export generated successfully',
          data: exportData,
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="taja-export-${user.userId}-${Date.now()}.json"`,
          },
        }
      );
    } catch (error: any) {
      console.error('Data export error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to export data' },
        { status: 500 }
      );
    }
  })(request);
}






