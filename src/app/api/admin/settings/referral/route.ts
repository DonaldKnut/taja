import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PlatformSettings from '@/models/PlatformSettings';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function normalizeReferral(doc: any) {
  const envPct = parseFloat(process.env.REFERRAL_BONUS_PERCENTAGE || '2');
  const enabledEnv = process.env.REFERRAL_ENABLED === 'false' ? false : true;
  const referral = doc?.referral || {};

  return {
    enabled: typeof referral.enabled === 'boolean' ? referral.enabled : enabledEnv,
    bonusPercentage:
      typeof referral.bonusPercentage === 'number' && referral.bonusPercentage >= 0
        ? referral.bonusPercentage
        : envPct,
  };
}

// GET /api/admin/settings/referral - Get referral program settings
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const doc = await PlatformSettings.findOne().lean();
      const referral = normalizeReferral(doc);
      return NextResponse.json({
        success: true,
        data: { referral },
      });
    } catch (error: any) {
      console.error('Admin referral settings GET error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to load referral settings' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/admin/settings/referral - Update referral program settings
export async function PUT(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const body = await request.json();

      const enabled = !!body?.referral?.enabled;
      const bonusRaw = Number(body?.referral?.bonusPercentage);

      if (!Number.isFinite(bonusRaw) || bonusRaw < 0 || bonusRaw > 100) {
        return NextResponse.json(
          { success: false, message: 'Referral bonus percentage must be between 0 and 100.' },
          { status: 400 }
        );
      }

      const doc = await PlatformSettings.findOneAndUpdate(
        {},
        {
          $set: {
            'referral.enabled': enabled,
            'referral.bonusPercentage': bonusRaw,
          },
        },
        { upsert: true, new: true }
      ).lean();

      const referral = normalizeReferral(doc);

      return NextResponse.json({
        success: true,
        message: 'Referral settings updated',
        data: { referral },
      });
    } catch (error: any) {
      console.error('Admin referral settings PUT error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update referral settings' },
        { status: 500 }
      );
    }
  })(request);
}

