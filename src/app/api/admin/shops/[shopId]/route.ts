import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/shops/[shopId] - Ban/remove a shop (e.g. for defaulting). Admin only.
 * Sets shop status to 'banned' and suspends all products so they no longer appear.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();

      const shop = await Shop.findById(params.shopId);
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Shop not found' },
          { status: 404 }
        );
      }

      if (shop.status === 'banned') {
        return NextResponse.json(
          { success: false, message: 'Shop is already banned' },
          { status: 400 }
        );
      }

      await shop.updateOne({ $set: { status: 'banned' } });
      await Product.updateMany(
        { shop: params.shopId },
        { $set: { status: 'suspended' } }
      );

      return NextResponse.json({
        success: true,
        message: 'Shop banned and its products suspended. It will no longer appear in the marketplace.',
        data: { shopId: params.shopId, status: 'banned' },
      });
    } catch (error: any) {
      console.error('Admin delete shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to ban shop' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PUT /api/admin/shops/[shopId] - Suspend or activate a shop (admin only).
 * Body: { action: 'suspend' | 'activate' }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(['admin'])(async () => {
    try {
      const body = await request.json();
      const { action } = body;

      if (!action || !['suspend', 'activate'].includes(action)) {
        return NextResponse.json(
          { success: false, message: 'Invalid action. Must be "suspend" or "activate"' },
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

      const newStatus = action === 'suspend' ? 'suspended' : 'active';
      await shop.updateOne({ $set: { status: newStatus } });

      if (action === 'suspend') {
        await Product.updateMany(
          { shop: params.shopId },
          { $set: { status: 'suspended' } }
        );
      } else {
        await Product.updateMany(
          { shop: params.shopId, status: 'suspended' },
          { $set: { status: 'active' } }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Shop ${action === 'suspend' ? 'suspended' : 'activated'} successfully`,
        data: { shopId: params.shopId, status: newStatus },
      });
    } catch (error: any) {
      console.error('Admin update shop error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update shop' },
        { status: 500 }
      );
    }
  })(request);
}
