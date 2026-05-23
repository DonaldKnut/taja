import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';
import PlatformSettings from '@/models/PlatformSettings';

export const dynamic = 'force-dynamic';

async function isReferralEnabled() {
  const envDefault = process.env.REFERRAL_ENABLED === 'false' ? false : true;
  const doc = await PlatformSettings.findOne().select('referral').lean();
  const referral = (doc as any)?.referral || {};
  if (typeof referral.enabled === 'boolean') return referral.enabled;
  return envDefault;
}

/**
 * GET /api/referrals/referred-users - List users referred by the current user (for sellers/buyers to see their referral list).
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      if (!(await isReferralEnabled())) {
        return NextResponse.json(
          {
            success: false,
            code: 'REFERRALS_DISABLED',
            message: 'Referral program is currently disabled.',
          },
          { status: 403 }
        );
      }
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
