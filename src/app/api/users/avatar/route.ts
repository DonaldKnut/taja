import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// POST /api/users/avatar - Update user avatar
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { avatarUrl } = body;

      if (!avatarUrl) {
        return NextResponse.json(
          { success: false, message: 'Avatar URL is required' },
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

      userDoc.avatar = avatarUrl;
      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: 'Avatar updated successfully',
        data: {
          avatar: userDoc.avatar,
        },
      });
    } catch (error: any) {
      console.error('Avatar update error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update avatar' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/users/avatar - Remove user avatar
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

      userDoc.avatar = '';
      await userDoc.save();

      return NextResponse.json({
        success: true,
        message: 'Avatar removed successfully',
        data: {
          avatar: '',
        },
      });
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to remove avatar' },
        { status: 500 }
      );
    }
  })(request);
}






