import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/products/[productId] - Set product status (suspend, activate, delete). Admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return requireRole(['admin'])(async () => {
    try {
      const body = await request.json();
      const { action } = body;

      if (!action || !['suspend', 'activate', 'delete'].includes(action)) {
        return NextResponse.json(
          { success: false, message: 'Invalid action. Must be "suspend", "activate", or "delete"' },
          { status: 400 }
        );
      }

      await connectDB();

      const product = await Product.findById(params.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      const newStatus = action === 'suspend' ? 'suspended' : action === 'activate' ? 'active' : 'deleted';
      (product as any).status = newStatus;
      await product.save();

      return NextResponse.json({
        success: true,
        message: `Product ${action === 'delete' ? 'deleted' : action === 'suspend' ? 'suspended' : 'activated'} successfully`,
        data: { productId: params.productId, status: newStatus },
      });
    } catch (error: any) {
      console.error('Admin product update error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update product' },
        { status: 500 }
      );
    }
  })(request);
}
