import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// POST /api/users/select-role - Select user role (buyer or seller)
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { role } = body;

      if (!role || !['buyer', 'seller'].includes(role)) {
        return NextResponse.json(
          { success: false, message: 'Invalid role. Must be "buyer" or "seller"' },
          { status: 400 }
        );
      }

      await connectDB();

      const userDoc = await User.findById(user.userId);
      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Update role and mark as selected
      userDoc.role = role;
      userDoc.roleSelected = true;
      userDoc.roleSelectionDate = new Date();

      // If selecting seller role, initialize KYC if not started
      if (role === 'seller' && (!userDoc.kyc || userDoc.kyc.status === 'not_started')) {
        userDoc.kyc = {
          ...userDoc.kyc,
          status: 'not_started',
        };
      }

      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: `Role set to ${role} successfully`,
        data: {
          role: userDoc.role,
          roleSelected: userDoc.roleSelected,
        },
      });
    } catch (error: any) {
      console.error('Select role error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to select role' },
        { status: 500 }
      );
    }
  })(request);
}






