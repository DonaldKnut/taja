jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
    redirect: (url: URL | string) => ({
      status: 307,
      headers: { location: String(url) },
    }),
  },
}));

jest.mock('@/lib/db', () => ({ connectDB: jest.fn() }));
jest.mock('@/lib/payments', () => ({
  verifyPayment: jest.fn(),
  escrow: { createEscrowHold: jest.fn() },
}));
jest.mock('@/models/Order', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn(() => ({ select: jest.fn(() => ({ lean: jest.fn() })) })) },
}));
jest.mock('@/models/WalletTransaction', () => ({
  __esModule: true,
  default: { findOne: jest.fn(() => ({ select: jest.fn(() => ({ lean: jest.fn() })) })), create: jest.fn() },
}));
jest.mock('@/lib/notifications', () => ({
  notifyPaymentUpdate: jest.fn(),
  notifyAdminsPaymentReceived: jest.fn(),
}));

import { POST } from '@/app/api/payments/verify/route';
import Order from '@/models/Order';
import { verifyPayment, escrow } from '@/lib/payments';
import { notifyPaymentUpdate, notifyAdminsPaymentReceived } from '@/lib/notifications';

describe('POST /api/payments/verify', () => {
  it('is idempotent when webhook is replayed', async () => {
    (Order.findOne as jest.Mock).mockResolvedValue({
      _id: 'order1',
      buyer: 'buyer1',
      seller: 'seller1',
      orderNumber: 'TAJA-001',
      totals: { total: 25000 },
    });
    (verifyPayment as jest.Mock).mockResolvedValue({
      status: 'success',
      data: { status: 'successful', amount: 25000 },
    });
    (Order.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ reference: 'ref-1', provider: 'paystack' }),
    } as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Webhook already processed');
    expect(escrow.createEscrowHold).not.toHaveBeenCalled();
    expect(notifyPaymentUpdate).not.toHaveBeenCalled();
    expect(notifyAdminsPaymentReceived).not.toHaveBeenCalled();
  });
});
