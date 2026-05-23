import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { handleDbError } from '@/lib/error-handler';
import { normalizeNigerianPhone, isValidNigerianPhone } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
      const humanized = handleDbError(error);
      return NextResponse.json(
        { success: false, message: humanized.message },
        { status: humanized.status }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { fullName, phone, avatar, preferences } = body;

      await connectDB();

      const userDoc = await User.findById(user.userId);

      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Update allowed fields
      if (fullName) userDoc.fullName = fullName;
      if (phone !== undefined && phone !== null && String(phone).trim()) {
        const normalized = normalizeNigerianPhone(String(phone).trim());
        if (!isValidNigerianPhone(normalized)) {
          return NextResponse.json(
            { success: false, message: 'Please provide a valid Nigerian phone number' },
            { status: 400 }
          );
        }
        const taken = await User.findOne({
          phone: normalized,
          _id: { $ne: userDoc._id },
        })
          .select('_id')
          .lean();
        if (taken) {
          return NextResponse.json(
            { success: false, message: 'This phone number is already registered to another account' },
            { status: 400 }
          );
        }
        userDoc.phone = normalized;
      }
      if (avatar) userDoc.avatar = avatar;
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


