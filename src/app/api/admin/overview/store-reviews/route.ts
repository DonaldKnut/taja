import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/overview/store-reviews — shops pending admin review
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();
      const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      const query = { status: 'pending' as const };

      const [shops, total] = await Promise.all([
        Shop.find(query)
          .populate('owner', 'fullName email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Shop.countDocuments(query),
      ]);

      const data = shops.map((s: any) => ({
        _id: String(s._id),
        shopName: s.shopName,
        shopSlug: s.shopSlug,
        description: s.description,
        status: s.status,
        verificationStatus: s.verification?.status || 'pending',
        createdAt: s.createdAt,
        owner: s.owner
          ? {
              _id: String(s.owner._id),
              fullName: s.owner.fullName,
              email: s.owner.email,
              phone: s.owner.phone,
            }
          : null,
      }));

      return NextResponse.json({
        success: true,
        data: {
          summary: { pending: total },
          shops: data,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error: any) {
      console.error('GET admin overview store-reviews error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch pending shops' },
        { status: 500 }
      );
    }
  })(request);
}
