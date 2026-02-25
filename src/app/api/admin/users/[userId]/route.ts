import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[userId] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const userDoc = await User.findById(params.userId)
        .select('-password -refreshTokens')
        .lean();

      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: userDoc,
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch user' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/admin/users/[userId] - Update user (ban, suspend, activate, or set role)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  return requireRole(['admin'])(async (req, adminUser) => {
    try {
      const body = await request.json();
      const { action, role } = body;

      await connectDB();

      const user = await User.findById(params.userId);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Role change: buyer <-> seller only (admin cannot set role to admin)
      if (role !== undefined) {
        if (!['buyer', 'seller'].includes(role)) {
          return NextResponse.json(
            { success: false, message: 'Role must be "buyer" or "seller"' },
            { status: 400 }
          );
        }
        if (params.userId === adminUser.userId) {
          return NextResponse.json(
            { success: false, message: 'You cannot change your own role' },
            { status: 400 }
          );
        }
        (user as any).role = role;
        await user.save();
        return NextResponse.json({
          success: true,
          message: `User role set to ${role}`,
          data: { userId: user._id, role: user.role },
        });
      }

      // Account status action
      if (!action || !['ban', 'suspend', 'activate'].includes(action)) {
        return NextResponse.json(
          { success: false, message: 'Provide "action" (ban, suspend, activate) or "role" (buyer, seller)' },
          { status: 400 }
        );
      }

      if (params.userId === adminUser.userId && action === 'ban') {
        return NextResponse.json(
          { success: false, message: 'You cannot ban yourself' },
          { status: 400 }
        );
      }

      if (action === 'ban') {
        user.accountStatus = 'banned';
      } else if (action === 'suspend') {
        user.accountStatus = 'suspended';
      } else if (action === 'activate') {
        user.accountStatus = 'active';
      }
      await user.save();

      return NextResponse.json({
        success: true,
        message: `User ${action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'activated'} successfully`,
        data: { userId: user._id, accountStatus: user.accountStatus },
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update user' },
        { status: 500 }
      );
    }
  })(request);
}







