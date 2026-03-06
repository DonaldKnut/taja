import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/cleanup
 * Cleans up demo data (seeded products, shops, and demo sellers)
 */
export async function DELETE(request: NextRequest) {
    return requireRole(['admin', 'seller'])(async (req, user) => {
        try {
            await connectDB();

            // Only delete demo data (shops/products created by demo sellers)
            const demoSellerEmails = [
                "jane@vintagefinds.ng",
                "chioma@handmade.ng",
                "mike@thrifthub.ng",
                "amina@retro.ng"
            ];

            // Find demo users
            const demoSellers = await User.find({ email: { $in: demoSellerEmails } });
            const demoSellerIds = demoSellers.map(s => s._id);

            if (demoSellerIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No demo data found to clean up',
                    data: { productsDeleted: 0, shopsDeleted: 0, usersDeleted: 0 }
                });
            }

            // Delete associated data
            const productsDeleted = await Product.deleteMany({ seller: { $in: demoSellerIds } });
            const shopsDeleted = await Shop.deleteMany({ owner: { $in: demoSellerIds } });
            const usersDeleted = await User.deleteMany({ _id: { $in: demoSellerIds } });

            return NextResponse.json({
                success: true,
                message: 'Demo data cleaned up successfully',
                data: {
                    productsDeleted: productsDeleted.deletedCount,
                    shopsDeleted: shopsDeleted.deletedCount,
                    usersDeleted: usersDeleted.deletedCount
                }
            });
        } catch (error: any) {
            console.error('[Cleanup API] Error:', error);
            return NextResponse.json(
                { success: false, message: error.message || 'Failed to cleanup data' },
                { status: 500 }
            );
        }
    })(request);
}
