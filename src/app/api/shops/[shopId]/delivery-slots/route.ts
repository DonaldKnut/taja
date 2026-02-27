import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shop from '@/models/Shop';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';

// GET /api/shops/:shopId/delivery-slots - List delivery slots with remaining capacity
export async function GET(request: NextRequest, { params }: { params: { shopId: string } }) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const includePast = searchParams.get('includePast') === 'true';

    const shop: any = await Shop.findById(params.shopId).select('settings.deliverySlots').lean();
    if (!shop?._id) {
      return NextResponse.json({ success: false, message: 'Shop not found' }, { status: 404 });
    }

    const slotsRaw = Array.isArray(shop?.settings?.deliverySlots) ? shop.settings.deliverySlots : [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const slots = slotsRaw
      .map((s: any) => ({
        id: String(s.id || ''),
        date: s.date ? new Date(s.date) : null,
        startTime: String(s.startTime || ''),
        endTime: s.endTime ? String(s.endTime) : '',
        maxOrders: Number(s.maxOrders || 0),
        notes: s.notes ? String(s.notes) : '',
        active: s.active !== false,
      }))
      .filter((s: any) => s.id && s.date && s.startTime && s.maxOrders > 0);

    const filtered = slots.filter((s: any) => {
      if (!s.active) return false;
      if (includePast) return true;
      return s.date >= startOfToday;
    });

    // Count already-booked orders per slot
    const results = await Promise.all(
      filtered.map(async (slot: any) => {
        const booked = await Order.countDocuments({
          shop: shop._id,
          status: { $nin: ['cancelled', 'refunded'] },
          'delivery.slotId': slot.id,
        });
        const remaining = Math.max(0, slot.maxOrders - booked);
        return {
          ...slot,
          booked,
          remaining,
        };
      })
    );

    // Sort by date then time
    results.sort((a: any, b: any) => {
      const d = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (d !== 0) return d;
      return String(a.startTime).localeCompare(String(b.startTime));
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Get delivery slots error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch delivery slots' },
      { status: 500 }
    );
  }
}

