jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock('@/lib/middleware', () => ({
  requireAuth: (handler: any) => (req: any) =>
    handler(req, { userId: 'buyer-1', email: 'buyer@test.com', role: 'buyer' }),
}));
jest.mock('@/lib/db', () => jest.fn());
jest.mock('@/models/Order', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));
jest.mock('@/lib/notifications', () => ({ notifyOrderUpdate: jest.fn() }));

import { POST } from '@/app/api/orders/[id]/dispute/route';
import Order from '@/models/Order';

function buildOrderFindResult(order: any) {
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(order),
    }),
  };
}

describe('POST /api/orders/:id/dispute', () => {
  it('rejects invalid dispute reason', async () => {
    const req = {
      json: async () => ({ reason: 'bad_reason', description: 'item issue' }),
    } as any;

    const res = await POST(req, { params: { id: 'o1' } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe('Invalid dispute reason');
  });

  it('rejects disputes for non-shipped orders', async () => {
    (Order.findById as jest.Mock).mockReturnValue(
      buildOrderFindResult({
        _id: 'o2',
        status: 'processing',
        buyer: { _id: { toString: () => 'buyer-1' } },
        seller: { _id: { toString: () => 'seller-1' } },
        buyerConfirmation: { status: 'pending' },
      })
    );

    const req = {
      json: async () => ({ reason: 'damaged', description: 'arrived broken' }),
    } as any;

    const res = await POST(req, { params: { id: 'o2' } });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe('Can only dispute shipped orders');
  });
});
