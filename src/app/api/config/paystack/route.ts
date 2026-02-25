import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/config/paystack
 * Returns Paystack public key for client use. Server reads either
 * NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY or PAYSTACK_PUBLIC_KEY so you only need
 * PAYSTACK_PUBLIC_KEY + PAYSTACK_SECRET_KEY in .env (no NEXT_PUBLIC_ required).
 */
export async function GET(request: NextRequest) {
  const publicKey =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.PAYSTACK_PUBLIC_KEY ||
    '';
  const configured = !!(publicKey && process.env.PAYSTACK_SECRET_KEY);
  return NextResponse.json({
    success: true,
    publicKey,
    configured,
  });
}
