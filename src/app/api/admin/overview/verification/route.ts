import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/verification — paginated pending seller KYC
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const base = { 'kyc.status': 'pending', role: 'seller' as const };

      const [rows, total] = await Promise.all([
        User.find(base)
          .select('fullName email phone kyc createdAt')
          .sort({ 'kyc.submittedAt': -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(base),
      ]);

      const data = rows.map((user: any) => ({
        userId: String(user._id),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        kyc: {
          status: user.kyc?.status,
          submittedAt: user.kyc?.submittedAt,
          businessName: user.kyc?.businessName,
          businessType: user.kyc?.businessType,
        },
        createdAt: user.createdAt,
      }));

      return NextResponse.json({
        success: true,
        data: {
          summary: { pending: total },
          items: data,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error: any) {
      console.error('GET admin overview verification error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch verification queue' },
        { status: 500 }
      );
    }
  })(request);
}
