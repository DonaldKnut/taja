import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/orders - Get all orders with filters
export async function GET(request: NextRequest) {
    return requireRole(['admin'])(async (req, user) => {
        try {
            await connectDB();

            const { searchParams } = new URL(request.url);
            const status = searchParams.get('status');
            const page = parseInt(searchParams.get('page') || '1');
            const limit = parseInt(searchParams.get('limit') || '20');
            const search = searchParams.get('search');

            // Build query (exclude soft-deleted)
            const query: any = { isDeleted: { $ne: true } };

            if (status) {
                query.status = status;
            }

            if (search) {
                query.$or = [
                    { orderNumber: { $regex: search, $options: 'i' } },
                    { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
                    { 'buyer.fullName': { $regex: search, $options: 'i' } },
                ];
            }

            const skip = (page - 1) * limit;

            const [orders, total] = await Promise.all([
                Order.find(query)
                    .populate('buyer', 'fullName email phone')
                    .populate('seller', 'fullName email phone')
                    .populate('shop', 'shopName shopSlug')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Order.countDocuments(query),
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        } catch (error: any) {
            console.error('Get admin orders error:', error);
            return NextResponse.json(
                { success: false, message: error.message || 'Failed to fetch orders' },
                { status: 500 }
            );
        }
    })(request);
}
