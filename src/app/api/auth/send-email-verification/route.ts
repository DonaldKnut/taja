import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateOTP, getOTPExpiry } from '@/lib/auth';
import { emailVerificationRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await emailVerificationRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
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

    // Generate new OTP
    const emailVerificationCode = generateOTP();
    const emailVerificationExpiry = getOTPExpiry(10);

    user.emailVerificationCode = emailVerificationCode;
    user.emailVerificationExpiry = emailVerificationExpiry;
    await user.save();

    // Send OTP email
    let emailSent = false;
    try {
      const { sendVerificationEmail } = await import('@/lib/email');
      await sendVerificationEmail(user.email, user.fullName, emailVerificationCode);
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue - will return OTP in development
    }

    // Return response with OTP in development mode
    const responseData: any = {};
    if (process.env.NODE_ENV === 'development' && !emailSent) {
      responseData.otpCode = emailVerificationCode;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code sent to your email',
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Send email verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

