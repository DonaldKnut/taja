import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/shops/[shopId]/review - Approve or reject a pending shop (admin only).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(['admin'])(async (req, adminUser) => {
    try {
      const body = await request.json();
      const { action } = body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { success: false, message: 'Invalid action. Must be "approve" or "reject"' },
          { status: 400 }
        );
      }

      await connectDB();

      const shop = await Shop.findById(params.shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        shop.status = 'active';
        shop.verification = shop.verification || {} as any;
        (shop.verification as any).status = 'verified';
        (shop.verification as any).verifiedAt = new Date();
        (shop.verification as any).verifiedBy = adminUser.userId;
      } else {
        (shop.verification as any) = shop.verification || {};
        (shop.verification as any).status = 'rejected';
      }

      await shop.save();

      return NextResponse.json({
        success: true,
        message: `Shop ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        data: {
          shopId: shop._id,
          status: shop.status,
          verificationStatus: (shop.verification as any)?.status,
        },
      });
    } catch (error: any) {
      console.error('Shop review error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to review shop' },
        { status: 500 }
      );
    }
  })(request);
}
