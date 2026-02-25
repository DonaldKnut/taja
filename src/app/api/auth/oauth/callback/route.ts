import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Legacy OAuth callback route - redirects to the new Google OAuth callback handler
 * This maintains backward compatibility for any existing OAuth flows
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Redirect to the new Google OAuth callback handler
    const newCallbackUrl = new URL("/api/auth/oauth/google/callback", request.url);
    searchParams.forEach((value, key) => {
      newCallbackUrl.searchParams.set(key, value);
    });
    
    return NextResponse.redirect(newCallbackUrl);
  } catch (error: any) {
    console.error("OAuth callback redirect error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, request.url)
    );
  }
}



