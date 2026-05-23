import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

function getFrontendUrl(request: NextRequest): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const host = request.headers.get('host');
  if (host) return host.startsWith('localhost') ? `http://${host}` : `https://${host}`;
  return 'http://localhost:3000';
}

export async function GET(request: NextRequest) {
  const FRONTEND_URL = getFrontendUrl(request);
  const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    `${FRONTEND_URL}/api/auth/oauth/google/callback`;
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirect = searchParams.get('redirect') || '/dashboard';
    const referralCode = (searchParams.get('ref') || '').trim();

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ redirect, referralCode: referralCode || undefined })).toString('base64');

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      state,
      prompt: 'consent',
    });

    // Return JSON with URL for frontend to redirect, or redirect directly
    const returnJson = searchParams.get('json') === 'true';
    if (returnJson) {
      return NextResponse.json({
        success: true,
        data: { url: authUrl },
      });
    }

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}








