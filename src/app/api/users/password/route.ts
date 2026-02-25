import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { comparePassword, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/users/password - Change user password
export async function PUT(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { success: false, message: 'Current password and new password are required' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, message: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      await connectDB();

      const userDoc = await User.findById(user.userId).select('+password');

      if (!userDoc) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user has a password (OAuth users might not have one)
      const hasPassword = !!userDoc.password;
      
      // If user has a password, require current password verification
      if (hasPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, message: 'Current password is required' },
            { status: 400 }
          );
        }
        
        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, userDoc.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, message: 'Current password is incorrect' },
            { status: 401 }
          );
        }
      }
      // If no password (OAuth user), allow creating password without current password

      // Hash and save new password
      userDoc.password = await hashPassword(newPassword);
      await userDoc.save();

      return NextResponse.json(
        {
          success: true,
          message: 'Password updated successfully',
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Change password error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to change password' },
        { status: 500 }
      );
    }
  })(request);
}






