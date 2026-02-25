import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { authRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked (virtual property)
    const isLocked = user.lockUntil && user.lockUntil > new Date();
    if (isLocked) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        },
        { status: 423 }
      );
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return NextResponse.json(
        {
          success: false,
          message: `Account is ${user.accountStatus}. Please contact support.`,
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      const updates: any = { $inc: { loginAttempts: 1 } };
      if (user.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) }; // 30 minutes
      }
      await User.findByIdAndUpdate(user._id, updates);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    await User.findByIdAndUpdate(user._id, {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });

    // Update last login
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

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
    await user.save();

    // Return user data (without password)
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
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: userData,
      },
    };

    const nextResponse = NextResponse.json(responseData, { status: 200 });

    // Set token cookie
    const isSecure = request.nextUrl.protocol === 'https:';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24 hours

    nextResponse.cookies.set('token', token, {
      path: '/',
      httpOnly: false, // Set to false so client-side code can still read it if needed, but middleware will always see it
      secure: isSecure,
      sameSite: 'lax',
      maxAge: maxAge,
    });

    return nextResponse;
  } catch (error: any) {
    console.error('Login error:', error);
    const msg = error?.message || 'Login failed';
    const isDbConnectionError =
      msg.includes('Could not connect to any servers') ||
      msg.includes('MongooseServerSelectionError') ||
      msg.includes('whitelist') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('querySrv');
    const status = isDbConnectionError ? 503 : 500;
    const friendlyMessage = isDbConnectionError
      ? 'Database is temporarily unavailable. Check your internet, firewall, or try again in a moment.'
      : msg;
    return NextResponse.json(
      { success: false, message: friendlyMessage },
      { status }
    );
  }
}

