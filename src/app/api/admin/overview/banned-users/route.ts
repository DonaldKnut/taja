import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/banned-users
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '25', 10)));
      const skip = (page - 1) * limit;
      const search = (request.nextUrl.searchParams.get('search') || '').trim();

      const query: Record<string, unknown> = { accountStatus: 'banned' };
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .select('fullName email phone role accountStatus createdAt lastLoginAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          summary: { banned: total },
          users,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error: any) {
      console.error('GET admin overview banned-users error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch banned users' },
        { status: 500 }
      );
    }
  })(request);
}
