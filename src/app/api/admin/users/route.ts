import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/users - Get all users with filters
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const role = searchParams.get('role');
      const accountStatus = searchParams.get('accountStatus');
      const kycStatus = searchParams.get('kycStatus');
      const page = parseInt(searchParams.get('page') || '1');
      const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
      const limit = Math.min(Math.max(1, rawLimit), 500);
      const search = searchParams.get('search');

      // Build query
      const query: any = {};

      if (role) {
        query.role = role;
      }

      if (accountStatus) {
        query.accountStatus = accountStatus;
      }

      if (kycStatus) {
        query['kyc.status'] = kycStatus;
      }

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(query)
          .select('fullName email phone role accountStatus kyc.status kyc.submittedAt kyc.kycRemindersSent kyc.lastKycReminderAt createdAt lastLoginAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          users: users.map((user: any) => ({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            accountStatus: user.accountStatus,
            kycStatus: user.kyc?.status || 'not_started',
            kycSubmittedAt: user.kyc?.submittedAt,
            kycRemindersSent: user.kyc?.kycRemindersSent || 0,
            lastKycReminderAt: user.kyc?.lastKycReminderAt,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('Get users error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch users' },
        { status: 500 }
      );
    }
  })(request);
}







