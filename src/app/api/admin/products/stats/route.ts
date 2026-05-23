import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return requireRole(['admin'])(async () => {
        try {
            await connectDB();

            const [totalCount, activeCount, pendingCount, allProducts] = await Promise.all([
                Product.countDocuments({ status: { $ne: 'deleted' } }),
                Product.countDocuments({ status: 'active' }),
                Product.countDocuments({ status: 'pending' }),
                Product.find({ status: { $ne: 'deleted' } }).select('price inventory.quantity').lean()
            ]);

            // Calculate exact total value (price * quantity)
            const totalValue = allProducts.reduce((acc, curr) => {
                const qty = curr.inventory?.quantity || 0;
                return acc + ((curr.price || 0) * qty);
            }, 0);

            return NextResponse.json({
                success: true,
                data: {
                    totalProducts: totalCount,
                    activeProducts: activeCount,
                    pendingProducts: pendingCount,
                    totalValue: totalValue
                }
            });
        } catch (error: any) {
            console.error('Admin product stats error:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to fetch product stats' },
                { status: 500 }
            );
        }
    })(request);
}
