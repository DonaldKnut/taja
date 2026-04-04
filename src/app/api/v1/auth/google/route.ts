/**
 * POST /api/v1/auth/google — Expo (expo-auth-session) Google sign-in using ID token.
 *
 * Google Cloud setup:
 * - OAuth 2.0 Client type **Web application**; set GOOGLE_WEB_CLIENT_ID to that client ID
 *   (same value as `webClientId` / `clientId` in expo-auth-session).
 * - Authorized JavaScript origins / redirect URIs must include your Expo auth redirect URLs
 *   (custom scheme e.g. com.your.app://, Expo proxy https://auth.expo.io/..., dev https://localhost if used).
 * - Mobile sends `id_token` from the Google auth response in JSON body as `idToken`.
 *
 * Does not replace web redirect OAuth (/api/auth/oauth/google/callback). Email/password unchanged.
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { authRateLimit } from '@/lib/rateLimit';
import {
  verifyGoogleIdTokenForExpo,
  signInWithGoogleIdToken,
} from '@/lib/google-mobile-auth';

export const dynamic = 'force-dynamic';

function getWebClientId(): string {
  return (
    process.env.GOOGLE_WEB_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    ''
  ).trim();
}

function isHttpsRequest(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  const forwarded = request.headers.get('x-forwarded-proto');
  if (forwarded === 'https') {
    return true;
  }
  return request.nextUrl.protocol === 'https:';
}

export async function POST(request: NextRequest) {
  const genericError = { success: false, message: 'Unable to complete sign-in. Please try again.' };

  try {
    if (!isHttpsRequest(request)) {
      return NextResponse.json(
        { success: false, message: 'Secure connection required.' },
        { status: 403 }
      );
    }

    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const webClientId = getWebClientId();
    if (!webClientId) {
      console.error('[api/v1/auth/google] GOOGLE_WEB_CLIENT_ID (or GOOGLE_CLIENT_ID) is not set');
      return NextResponse.json(genericError, { status: 503 });
    }

    let body: { idToken?: string; role?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(genericError, { status: 400 });
    }

    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';
    if (!idToken) {
      return NextResponse.json(genericError, { status: 400 });
    }

    const roleRaw = body.role;
    const roleHint =
      roleRaw === 'buyer' || roleRaw === 'seller' ? roleRaw : undefined;

    await connectDB();

    let profile;
    try {
      profile = await verifyGoogleIdTokenForExpo(idToken, webClientId);
    } catch (e: unknown) {
      console.error('[api/v1/auth/google] ID token verification failed:', e);
      return NextResponse.json(genericError, { status: 401 });
    }

    let session;
    try {
      session = await signInWithGoogleIdToken({
        profile,
        roleHint,
        request,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'GOOGLE_ACCOUNT_MISMATCH') {
        return NextResponse.json(genericError, { status: 409 });
      }
      if (code === 'ACCOUNT_LOCKED') {
        return NextResponse.json(genericError, { status: 423 });
      }
      if (code === 'ACCOUNT_INACTIVE') {
        return NextResponse.json(genericError, { status: 403 });
      }
      console.error('[api/v1/auth/google] sign-in error:', e);
      return NextResponse.json(genericError, { status: 500 });
    }

    const responseData = {
      success: true,
      message: 'Login successful',
      data: {
        token: session.token,
        refreshToken: session.refreshToken,
        user: session.user,
      },
    };

    const nextResponse = NextResponse.json(responseData, { status: 200 });
    const isSecure = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    const maxAge = 30 * 24 * 60 * 60;
    nextResponse.cookies.set('token', session.token, {
      path: '/',
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      maxAge,
    });

    return nextResponse;
  } catch (error: unknown) {
    console.error('[api/v1/auth/google] unexpected error:', error);
    return NextResponse.json(genericError, { status: 500 });
  }
}
