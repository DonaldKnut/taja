import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/kyc - List all users who have submitted KYC (any status).
 * Used by admin KYC page to show pending, approved, rejected with full details.
 */
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();

      const users = await User.find({
        'kyc.submittedAt': { $exists: true, $ne: null },
      })
        .select('fullName email phone kyc createdAt')
        .sort({ 'kyc.submittedAt': -1 })
        .lean();

      const kyc = users.map((u: any) => ({
        _id: u._id.toString(),
        userId: {
          _id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
        },
        businessName: u.kyc?.businessName,
        businessType: u.kyc?.businessType,
        businessRegistrationNumber: u.kyc?.businessRegistrationNumber,
        idType: u.kyc?.idType,
        idNumber: u.kyc?.idNumber,
        bankName: u.kyc?.bankName,
        accountNumber: u.kyc?.accountNumber,
        accountName: u.kyc?.accountName,
        bankVerificationNumber: u.kyc?.bankVerificationNumber,
        status: u.kyc?.status || 'pending',
        createdAt: u.kyc?.submittedAt || u.createdAt,
        rejectionReason: u.kyc?.rejectionReason,
      }));

      return NextResponse.json({ success: true, kyc });
    } catch (error: any) {
      console.error('GET /api/admin/kyc error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch KYC list' },
        { status: 500 }
      );
    }
  })(request);
}
