import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/shops/pending - List shops with status pending (awaiting admin review).
 * Used by admin dashboard to show "users looking to set up shop".
 */
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();

      const shops = await Shop.find({ status: 'pending' })
        .populate('owner', 'fullName email phone')
        .sort({ createdAt: -1 })
        .lean();

      const data = shops.map((s: any) => ({
        _id: s._id.toString(),
        shopName: s.shopName,
        shopSlug: s.shopSlug,
        description: s.description,
        status: s.status,
        verificationStatus: s.verification?.status || 'pending',
        createdAt: s.createdAt,
        owner: s.owner
          ? {
              _id: (s.owner as any)._id?.toString(),
              fullName: (s.owner as any).fullName,
              email: (s.owner as any).email,
              phone: (s.owner as any).phone,
            }
          : null,
      }));

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error('GET /api/admin/shops/pending error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch pending shops' },
        { status: 500 }
      );
    }
  })(request);
}
