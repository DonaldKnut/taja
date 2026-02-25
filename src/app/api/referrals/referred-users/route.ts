import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * GET /api/referrals/referred-users - List users referred by the current user (for sellers/buyers to see their referral list).
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      const referred = await User.find({ referredBy: user.userId })
        .select('fullName email createdAt role')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();
      return NextResponse.json({
        success: true,
        data: referred.map((u: any) => ({
          _id: u._id,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          joinedAt: u.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Referrals referred-users error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch referred users' },
        { status: 500 }
      );
    }
  })(request);
}
