import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/subscribers - List users with email (for broadcast).
 * Returns id, email, fullName, role for admin to select and send messages.
 */
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
      const search = searchParams.get('search');
      const role = searchParams.get('role');

      const query: any = { email: { $exists: true, $ne: '' } };
      if (role) query.role = role;
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find(query)
          .select('_id email fullName role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          subscribers: users.map((u: any) => ({
            _id: u._id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
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
      console.error('GET admin subscribers error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }
  })(request);
}
