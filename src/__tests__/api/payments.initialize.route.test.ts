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
jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }));
jest.mock('@/lib/payments', () => ({ initializePayment: jest.fn() }));
jest.mock('uuid', () => ({ v4: () => 'abcd1234efgh5678' }));
jest.mock('@/models/Order', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

import { POST } from '@/app/api/payments/initialize/route';
import Order from '@/models/Order';

function buildFindByIdResult(order: any) {
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(order),
    }),
  };
}

describe('POST /api/payments/initialize', () => {
  it('returns 400 when orderId is missing', async () => {
    const req = { json: async () => ({}) } as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe('Order ID is required');
  });

  it('returns 403 when buyer does not own order', async () => {
    (Order.findById as jest.Mock).mockReturnValue(
      buildFindByIdResult({
        _id: 'order-2',
        buyer: { toString: () => 'someone-else' },
        paymentStatus: 'pending',
        totals: { total: 10000 },
      })
    );

    const req = { json: async () => ({ orderId: 'order-2' }) } as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe('Unauthorized');
  });
});
