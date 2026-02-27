import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import PlatformSettings from '@/models/PlatformSettings';
import { hashPassword, generateOTP, getOTPExpiry } from '@/lib/auth';
import { authRateLimit } from '@/lib/rateLimit';
import { handleDbError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { fullName, email, phone, password, role = 'buyer', referralCode } = body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const emailNorm = email.toLowerCase().trim();
    const phoneNorm = (phone && typeof phone === 'string') ? phone.trim() : '';

    // Check which one is already used so we can tell the user
    const [existingByEmail, existingByPhone] = await Promise.all([
      emailNorm ? User.findOne({ email: emailNorm }).select('_id').lean() : Promise.resolve(null),
      phoneNorm ? User.findOne({ phone: phoneNorm }).select('_id').lean() : Promise.resolve(null),
    ]);

    if (existingByEmail && existingByPhone) {
      return NextResponse.json(
        { success: false, message: 'An account with this email and phone number already exists.' },
        { status: 400 }
      );
    }
    if (existingByEmail) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists. Try logging in or use a different email.' },
        { status: 400 }
      );
    }
    if (existingByPhone) {
      return NextResponse.json(
        { success: false, message: 'An account with this phone number already exists. Try logging in or use a different phone number.' },
        { status: 400 }
      );
    }

    // Check for duplicate phone (fraud detection) - already ruled out above, but keep for any edge case
    const fraudFlags: any = {};

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const emailVerificationCode = generateOTP();
    const emailVerificationExpiry = getOTPExpiry(10);

    // Optional referral (only when referral program is enabled)
    let referredBy: any = undefined;
    const refSettings = await PlatformSettings.findOne().select('referral').lean();
    const refEnabled = (refSettings as any)?.referral?.enabled !== false;
    if (refEnabled && referralCode && typeof referralCode === 'string') {
      const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() }).select('_id').lean();
      if (referrer?._id) {
        referredBy = referrer._id;
      }
    }

    // Create user (role already chosen at register → mark roleSelected so we skip role-selection in onboarding)
    const user = await User.create({
      fullName,
      email: emailNorm,
      phone: phoneNorm || undefined,
      password: hashedPassword,
      role,
      roleSelected: true,
      roleSelectionDate: new Date(),
      ...(referredBy ? { referredBy } : {}),
      emailVerificationCode,
      emailVerificationExpiry,
      fraudFlags,
      accountStatus: fraudFlags.duplicatePhone ? 'under_review' : 'active',
    });

    // Increment referrer stats (best-effort)
    if (referredBy) {
      User.findByIdAndUpdate(referredBy, { $inc: { 'referralStats.totalReferred': 1 } }).catch(() => { });
    }

    // Send verification code email (required for email signup)
    let emailSent = false;
    try {
      const { sendVerificationEmail, sendWelcomeEmail } = await import('@/lib/email');
      await sendVerificationEmail(user.email, user.fullName, emailVerificationCode);
      emailSent = true;
      // Also send welcome email so they get both: "Welcome to Taja.Shop" and the verification code
      sendWelcomeEmail(user.email, user.fullName).catch((err) =>
        console.error('Failed to send welcome email:', err)
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue - will return OTP in development
    }

    // Return response with OTP in development mode
    const responseData: any = {
      userId: user._id,
      email: user.email,
    };

    // Only include OTP in development
    if (process.env.NODE_ENV === 'development' && !emailSent) {
      responseData.otpCode = emailVerificationCode;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const humanized = handleDbError(error);
    return NextResponse.json(
      { success: false, message: humanized.message },
      { status: humanized.status }
    );
  }
}

