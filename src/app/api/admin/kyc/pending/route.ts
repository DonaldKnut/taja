import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/kyc/pending - Get all pending KYC submissions
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const pendingKyc = await User.find({
        'kyc.status': 'pending',
        role: 'seller',
      })
        .select('fullName email phone kyc createdAt')
        .sort({ 'kyc.submittedAt': -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: pendingKyc.map((user) => ({
          userId: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          kyc: {
            status: user.kyc?.status,
            submittedAt: user.kyc?.submittedAt,
            businessName: user.kyc?.businessName,
            businessType: user.kyc?.businessType,
            idType: user.kyc?.idType,
            idNumber: user.kyc?.idNumber,
            bankName: user.kyc?.bankName,
            accountNumber: user.kyc?.accountNumber,
            accountName: user.kyc?.accountName,
            bankVerificationNumber: user.kyc?.bankVerificationNumber,
            businessRegistrationNumber: user.kyc?.businessRegistrationNumber,
          },
          createdAt: user.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Get pending KYC error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch pending KYC' },
        { status: 500 }
      );
    }
  })(request);
}







