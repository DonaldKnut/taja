import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateOTP, getOTPExpiry } from "@/lib/auth";
import { emailVerificationRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

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
        { success: false, message: "Email is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: "Email is already verified" },
        { status: 400 },
      );
    }

    // Generate new OTP
    const emailVerificationCode = generateOTP();
    const emailVerificationExpiry = getOTPExpiry(10);

    user.emailVerificationCode = emailVerificationCode;
    user.emailVerificationExpiry = emailVerificationExpiry;
    await user.save();

    // Send OTP email
    // Send verification email
    let emailSent = false;
    let emailError: any = null;

    try {
      const { sendVerificationEmail } = await import("@/lib/email");

      console.log(
        "[RESEND_VERIFICATION] Attempting to send email to:",
        user.email,
      );
      console.log(
        "[RESEND_VERIFICATION] RESEND_API_KEY exists:",
        !!process.env.RESEND_API_KEY,
      );
      console.log(
        "[RESEND_VERIFICATION] EMAIL_FROM:",
        process.env.EMAIL_FROM || process.env.RESEND_FROM,
      );

      const result = await sendVerificationEmail(
        user.email,
        user.fullName,
        emailVerificationCode,
      );

      if (result?.success) {
        emailSent = true;
        console.log(
          "[RESEND_VERIFICATION] ✅ Email sent successfully to:",
          user.email,
        );
      } else {
        emailError = result?.error;
        console.error(
          "[RESEND_VERIFICATION] ❌ Email send failed:",
          emailError,
        );
      }
    } catch (error: any) {
      emailError = error;
      console.error("[RESEND_VERIFICATION] ❌ Exception sending email:", {
        error: error.message,
        stack: error.stack,
        email: user.email,
      });
    }

    // Log critical error in production
    if (process.env.NODE_ENV === "production" && !emailSent) {
      console.error(
        "[RESEND_VERIFICATION] 🚨 CRITICAL: Email failed in production!",
        {
          email: user.email,
          error: emailError?.message || emailError,
          hasApiKey: !!process.env.RESEND_API_KEY,
          hasEmailFrom: !!(process.env.EMAIL_FROM || process.env.RESEND_FROM),
          timestamp: new Date().toISOString(),
        },
      );
    }

    // Return response with OTP in development mode
    const responseData: any = {};
    if (process.env.NODE_ENV === "development" && !emailSent) {
      responseData.otpCode = emailVerificationCode;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent to your email",
        data: responseData,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Send email verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send verification code",
      },
      { status: 500 },
    );
  }
}
