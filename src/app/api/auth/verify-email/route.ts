import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken, generateRefreshToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check if code matches
    if (user.emailVerificationCode !== code) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiry = undefined;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;

    const tokenPayload = {
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

    await user.save();

    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };

    const responseData = {
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        refreshToken,
        user: userData,
      },
    };

    const nextResponse = NextResponse.json(responseData, { status: 200 });
    const isSecure = request.nextUrl.protocol === 'https:';
    const maxAge = 30 * 24 * 60 * 60;
    nextResponse.cookies.set('token', token, {
      path: '/',
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      maxAge,
    });

    return nextResponse;
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}








