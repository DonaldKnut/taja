import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware';
import { verifyIdentity } from '@/modules/verification';
import { addCorsHeaders, handleCorsPreflight } from '@/modules/http';

export const dynamic = 'force-dynamic';

// Handle OPTIONS preflight for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin);
}

/**
 * POST /api/verify/identity - Verify identity documents (NIN, Passport, Voter's Card, Driver's License)
 * Uses Dojah API with fallback to manual verification when Dojah fails or is not configured
 * 
 * Response includes:
 * - verified: true if Dojah verified successfully
 * - requiresManualVerification: true if fallback to manual verification
 * - provider: 'dojah' | 'manual'
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  const { user, error } = await authenticate(request);
  if (!user) {
    const code = error === 'Unauthorized: invalid token' ? 'INVALID_TOKEN' : 'AUTH_REQUIRED';
    const message =
      code === 'INVALID_TOKEN'
        ? 'Access token is invalid or expired'
        : 'Authentication required';
    const response = NextResponse.json(
      { ok: false, code, message },
      { status: 401 }
    );
    return addCorsHeaders(response, origin);
  }

  try {
    const body = await request.json();
    const { idType, idNumber, firstName, lastName, dateOfBirth } = body;

    if (!idType || !idNumber) {
      const response = NextResponse.json(
        { success: false, message: 'ID type and ID number are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Validate ID type
    const validTypes = ['nin', 'passport', 'voters_card', 'drivers_license'];
    if (!validTypes.includes(idType)) {
      const response = NextResponse.json(
        { success: false, message: 'Invalid ID type' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Verify identity document
    const result = await verifyIdentity({
      idType: idType as any,
      idNumber,
      firstName,
      lastName,
      dateOfBirth,
    });

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          verified: false,
          message: result.error || 'Verification failed',
        },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // Check if manual verification is required
    const requiresManualVerification = (result as any).requiresManualVerification || false;

    const response = NextResponse.json({
      success: true,
      verified: result.verified,
      requiresManualVerification,
      data: result.data,
      provider: result.provider,
      message: result.verified
        ? 'Identity verified successfully via Dojah'
        : requiresManualVerification
        ? 'Identity will be manually verified by admin'
        : 'Identity could not be verified',
    });

    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error('Identity verification error:', error);
    const response = NextResponse.json(
      { success: false, message: error.message || 'Failed to verify identity' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

// Phone verification endpoint removed - phone verification disabled to avoid SMS costs






