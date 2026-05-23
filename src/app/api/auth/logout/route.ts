import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// POST /api/auth/logout - Logout user and invalidate refresh tokens
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const refreshToken = req.headers.get('x-refresh-token') ||
        (await req.json().catch(() => ({}))).refreshToken;

      // Remove the specific refresh token if provided
      if (refreshToken) {
        await User.findByIdAndUpdate(user.userId, {
          $pull: {
            refreshTokens: { token: refreshToken },
          },
        });
      } else {
        // If no specific token provided, clear all refresh tokens for this user
        // This is more secure - logs out from all devices
        await User.findByIdAndUpdate(user.userId, {
          $set: { refreshTokens: [] },
        });
      }

      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully',
      });

      // Clear the token cookie
      response.cookies.delete('token');

      return response;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if there's an error, return success to not block client-side cleanup
      return NextResponse.json(
        {
          success: true,
          message: 'Logged out successfully',
        },
        { status: 200 }
      );
    }
  })(request);
}
