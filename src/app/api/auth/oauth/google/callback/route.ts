import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { connectDB, User } from '@/modules/db';
import { applyGooglePictureToSellerShop } from '@/lib/oauthShopAvatar';
import PlatformSettings from '@/models/PlatformSettings';
import { generateToken, generateRefreshToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/modules/email';

export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
// Base URL: FRONTEND_URL > NEXTAUTH_URL > Vercel (VERCEL_URL) > localhost
function getFrontendUrl(request: NextRequest): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const host = request.headers.get('host');
  if (host) return host.startsWith('localhost') ? `http://${host}` : `https://${host}`;
  return 'https://tajaapp.shop';
}

export async function GET(request: NextRequest) {
  const FRONTEND_URL = getFrontendUrl(request);
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    let stateData: any = null;
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch {
        stateData = null;
      }
    }
    const referralCodeFromState: string | undefined =
      typeof stateData?.referralCode === 'string' && stateData.referralCode.trim()
        ? stateData.referralCode.trim().toUpperCase()
        : undefined;

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, FRONTEND_URL)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_failed', FRONTEND_URL)
      );
    }

    await connectDB();

    // IMPORTANT:
    // Some deployments may still have a User schema where `phone` is required.
    // Google OAuth doesn't provide phone by default, so we must avoid blocking OAuth flows.
    // We validate only when a phone is present (or when other routes explicitly enforce it).
    const saveUser = async (u: any) =>
      u.save({ validateBeforeSave: Boolean(u.phone) });

    // Use GOOGLE_REDIRECT_URI if set, otherwise construct from current app URL
    const GOOGLE_REDIRECT_URI =
      process.env.GOOGLE_REDIRECT_URI ||
      `${FRONTEND_URL}/api/auth/oauth/google/callback`;

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_token', FRONTEND_URL)
      );
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();
    const name = payload.name || '';
    const picture = payload.picture;
    const emailVerified = payload.email_verified || false;

    if (!email) {
      return NextResponse.redirect(
        new URL('/login?error=no_email', FRONTEND_URL)
      );
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - link Google OAuth if not already linked
      if (!user.oauthProviders?.google) {
        user.oauthProviders = user.oauthProviders || {};
        user.oauthProviders.google = {
          id: googleId,
          email: email,
          verified: emailVerified,
        };
        // If Google verified the email, mark as verified
        if (emailVerified && !user.emailVerified) {
          user.emailVerified = true;
        }
        await saveUser(user);
      }
      // Update avatar from Google if user doesn't have one or if it's an OAuth user
      if (picture && (!user.avatar || user.oauthProviders?.google)) {
        user.avatar = picture;
        await saveUser(user);
      }
    } else {
      // New user - create account (phone optional for OAuth; collect later in profile)
      // Explicitly instantiate + save so `validateBeforeSave` is honored consistently.
      user = new User({
        fullName: name,
        email: email,
        role: 'buyer',
        emailVerified: emailVerified,
        avatar: picture,
        oauthProviders: {
          google: {
            id: googleId,
            email: email,
            verified: emailVerified,
          },
        },
        accountStatus: 'active',
      });
      await user.save({ validateBeforeSave: false });

      // Send welcome email
      try {
        await sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Apply referral if present (only when referral program is enabled and not already set)
    const refDoc = await PlatformSettings.findOne().select('referral').lean();
    const refEnabled = (refDoc as any)?.referral?.enabled !== false;
    if (refEnabled && referralCodeFromState && !user.referredBy) {
      const referrer = await User.findOne({ referralCode: referralCodeFromState }).select('_id').lean();
      if (referrer?._id && referrer._id.toString() !== user._id.toString()) {
        (user as any).referredBy = referrer._id;
        await saveUser(user);
        User.findByIdAndUpdate(referrer._id, { $inc: { 'referralStats.totalReferred': 1 } }).catch(() => { });
      }
    }

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const deviceId = request.headers.get('user-agent') || 'unknown';
    user.refreshTokens.push({
      token: refreshToken,
      deviceId: deviceId.substring(0, 100),
      deviceInfo: deviceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await saveUser(user);

    if (picture && user.role === 'seller') {
      try {
        await applyGooglePictureToSellerShop(user._id.toString(), picture);
      } catch (syncErr) {
        console.error('OAuth seller shop avatar sync:', syncErr);
      }
    }

    // Determine redirect path based on user state
    let redirectPath = '/dashboard';

    // If new user or role not selected, redirect to role selection
    if (!user.roleSelected) {
      redirectPath = '/onboarding/role-selection';
    } else if (user.role === 'seller') {
      // Check if seller needs KYC
      if (!user.kyc || user.kyc.status === 'not_started' || user.kyc.status === 'pending') {
        redirectPath = '/onboarding/kyc';
      } else if (user.kyc.status === 'approved') {
        redirectPath = '/seller/dashboard';
      } else {
        redirectPath = '/onboarding/kyc?status=rejected';
      }
    } else {
      redirectPath = '/dashboard';
    }

    // Override with state redirect if provided (for existing users)
    if (stateData?.redirect) {
      let finalRedirect = decodeURIComponent(stateData.redirect);
      // Ensure it starts with /
      if (!finalRedirect.startsWith("/")) finalRedirect = "/" + finalRedirect;
      // Strip redundant /auth
      if (finalRedirect.startsWith("/auth/")) {
        finalRedirect = finalRedirect.replace("/auth/", "/");
      }

      if (user.roleSelected) {
        redirectPath = finalRedirect;
      }
    }

    // Redirect to frontend auth callback handler with tokens in the URL.
    // The /auth/callback page is responsible for:
    // - Storing token/refreshToken in localStorage + cookies
    // - Refreshing AuthContext
    // - Finally redirecting to the desired page (redirectPath)
    const callbackUrl = new URL('/auth/callback', FRONTEND_URL);
    callbackUrl.searchParams.set('success', 'true');
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('refreshToken', refreshToken);
    callbackUrl.searchParams.set('redirect', redirectPath);

    return NextResponse.redirect(callbackUrl);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    const msg = error?.message || '';
    const isDbConnectionError =
      msg.includes('Could not connect to any servers') ||
      msg.includes('MongooseServerSelectionError') ||
      msg.includes('whitelist') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('querySrv');
    const errorParam = isDbConnectionError ? 'db_unavailable' : (error.message || 'oauth_failed');
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam)}`, FRONTEND_URL)
    );
  }
}

