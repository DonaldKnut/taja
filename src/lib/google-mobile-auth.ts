import type { NextRequest } from 'next/server';
import User, { type IUser } from '@/models/User';
import { generateToken, generateRefreshToken, type JWTPayload } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import {
  verifyGoogleIdTokenForExpo,
  type GoogleIdProfile,
} from '@/lib/google-id-token-verify';

export { verifyGoogleIdTokenForExpo, type GoogleIdProfile } from '@/lib/google-id-token-verify';

const saveUser = async (u: IUser) =>
  u.save({ validateBeforeSave: Boolean(u.phone) });

export type GoogleMobileAuthSuccess = {
  token: string;
  refreshToken: string;
  user: {
    _id: unknown;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
    accountStatus: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
};

/**
 * Find or create user from a verified Google profile, issue Taja JWTs (same as email login).
 */
export async function signInWithGoogleIdToken(params: {
  profile: GoogleIdProfile;
  roleHint?: 'buyer' | 'seller';
  request: NextRequest;
}): Promise<GoogleMobileAuthSuccess> {
  const { profile, roleHint, request } = params;
  const { sub: googleId, email, emailVerified, name, picture } = profile;

  let user =
    (await User.findOne({ 'oauthProviders.google.id': googleId })) ||
    (await User.findOne({ email }));

  if (user) {
    const isLocked = user.lockUntil && user.lockUntil > new Date();
    if (isLocked) {
      const err = new Error('account_locked');
      (err as { code?: string }).code = 'ACCOUNT_LOCKED';
      throw err;
    }
    if (user.accountStatus !== 'active') {
      const err = new Error('account_inactive');
      (err as { code?: string }).code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    if (
      user.oauthProviders?.google?.id &&
      user.oauthProviders.google.id !== googleId
    ) {
      const err = new Error('google_account_mismatch');
      (err as { code?: string }).code = 'GOOGLE_ACCOUNT_MISMATCH';
      throw err;
    }
    if (!user.oauthProviders?.google) {
      user.oauthProviders = user.oauthProviders || {};
      user.oauthProviders.google = {
        id: googleId,
        email,
        verified: emailVerified,
      };
    } else {
      user.oauthProviders.google.id = googleId;
      user.oauthProviders.google.email = email;
      user.oauthProviders.google.verified = emailVerified;
    }
    if (emailVerified && !user.emailVerified) {
      user.emailVerified = true;
    }
    if (picture && (!user.avatar || user.oauthProviders?.google)) {
      user.avatar = picture;
    }
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await saveUser(user);
  } else {
    const role =
      roleHint === 'seller' || roleHint === 'buyer' ? roleHint : 'buyer';
    const roleSelected = roleHint === 'seller' || roleHint === 'buyer';

    user = new User({
      fullName: name,
      email,
      role,
      emailVerified: emailVerified,
      avatar: picture,
      oauthProviders: {
        google: {
          id: googleId,
          email,
          verified: emailVerified,
        },
      },
      accountStatus: 'active',
      ...(roleSelected
        ? { roleSelected: true, roleSelectionDate: new Date() }
        : {}),
    });
    await user.save({ validateBeforeSave: false });

    sendWelcomeEmail(email, name).catch(() => {});
  }

  const tokenPayload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const deviceId = request.headers.get('user-agent') || 'unknown';
  user.refreshTokens.push({
    token: refreshToken,
    deviceId: deviceId.substring(0, 100),
    deviceInfo: deviceId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await saveUser(user);

  return {
    token,
    refreshToken,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    },
  };
}
