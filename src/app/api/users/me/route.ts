import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { handleDbError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

// GET /api/users/me - Get current user profile (alias for /api/auth/profile)
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

      return NextResponse.json(
        {
          success: true,
          data: userDoc,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Get user profile error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get profile' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { fullName, phone, avatar, preferences, role } = body;

      await connectDB();

      const userDoc = await User.findById(user.userId);

      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Update allowed fields
      if (fullName !== undefined) userDoc.fullName = fullName;
      if (phone !== undefined) userDoc.phone = phone;
      if (avatar !== undefined) userDoc.avatar = avatar;
      if (role !== undefined && ['buyer', 'seller'].includes(role)) {
        userDoc.role = role;
        userDoc.roleSelected = true;
        userDoc.roleSelectionDate = new Date();
        if (role === 'seller' && (!userDoc.kyc || userDoc.kyc.status === 'not_started')) {
          userDoc.kyc = { ...userDoc.kyc, status: 'not_started' };
        }
      }
      if (preferences) {
        userDoc.preferences = {
          ...userDoc.preferences,
          ...preferences,
        };
      }

      await userDoc.save();

      const userData = {
        _id: userDoc._id,
        fullName: userDoc.fullName,
        email: userDoc.email,
        phone: userDoc.phone,
        role: userDoc.role,
        avatar: userDoc.avatar,
        accountStatus: userDoc.accountStatus,
        emailVerified: userDoc.emailVerified,
        phoneVerified: userDoc.phoneVerified,
        preferences: userDoc.preferences,
      };

      return NextResponse.json(
        {
          success: true,
          message: 'Profile updated successfully',
          data: userData,
        },
        { status: 200 }
      );
    } catch (error: any) {
      const humanized = handleDbError(error);
      return NextResponse.json(
        { success: false, message: humanized.message },
        { status: humanized.status }
      );
    }
  })(request);
}

// DELETE /api/users/me - Delete current user account
export async function DELETE(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const userDoc = await User.findById(user.userId);

      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Soft delete: Mark account as deleted instead of actually deleting
      // This preserves data integrity and allows for potential recovery
      userDoc.accountStatus = 'banned';
      userDoc.email = `deleted_${Date.now()}_${userDoc.email}`;
      userDoc.phone = `deleted_${Date.now()}_${userDoc.phone}`;
      userDoc.fullName = 'Deleted User';
      userDoc.password = ''; // Clear password
      userDoc.avatar = '';
      userDoc.addresses = [];
      userDoc.refreshTokens = [];

      await userDoc.save();

      return NextResponse.json(
        {
          success: true,
          message: 'Account deleted successfully',
        },
        { status: 200 }
      );
    } catch (error: any) {
      const humanized = handleDbError(error);
      return NextResponse.json(
        { success: false, message: humanized.message },
        { status: humanized.status }
      );
    }
  })(request);
}


