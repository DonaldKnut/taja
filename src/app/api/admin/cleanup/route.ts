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

            const demoSellerEmails = [
                "jane@vintagefinds.ng",
                "chioma@handmade.ng",
                "mike@thrifthub.ng",
                "amina@retro.ng",
                "demo@taja.shop",
                "seller@example.com"
            ];

            const searchParams = request.nextUrl.searchParams;
            const forceAll = searchParams.get('force') === 'all';

            if (forceAll) {
                const productsDeleted = await Product.deleteMany({});
                const shopsDeleted = await Shop.deleteMany({});
                // We don't delete all users for safety, just demo ones
                const usersDeleted = await User.deleteMany({ email: { $in: demoSellerEmails } });

                return NextResponse.json({
                    success: true,
                    message: 'Full marketplace purge completed',
                    data: { productsDeleted: productsDeleted.deletedCount, shopsDeleted: shopsDeleted.deletedCount, usersDeleted: usersDeleted.deletedCount }
                });
            }

            // Find demo users
            const demoSellers = await User.find({
                $or: [
                    { email: { $in: demoSellerEmails } },
                    { fullName: { $in: ["Jane Smith", "Chioma Okafor", "Mike Johnson", "Amina Bello"] } }
                ]
            });
            const demoSellerIds = demoSellers.map(s => s._id);

            // Also find shops by demo names
            const demoShops = await Shop.find({
                shopSlug: { $in: ["vintage-finds-lagos", "handmade-by-chioma", "thrift-fashion-hub", "retro-collectibles"] }
            });
            const demoShopIds = demoShops.map(s => s._id);

            // Delete associated data
            const productsDeleted = await Product.deleteMany({
                $or: [
                    { seller: { $in: demoSellerIds } },
                    { shop: { $in: demoShopIds } },
                    { title: { $regex: /Vintage|Retro|Ankara Jewelry Set/i } } // Identifying common demo titles
                ]
            });
            const shopsDeleted = await Shop.deleteMany({
                $or: [
                    { owner: { $in: demoSellerIds } },
                    { _id: { $in: demoShopIds } }
                ]
            });
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
