import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  generatePasswordResetToken,
  getPasswordResetExpiry,
  canUserResetPassword,
  isAccountEligibleForReset,
  sanitizeEmail,
  createPasswordResetResponse,
  checkPasswordResetRateLimit,
  recordPasswordResetAttempt,
  PASSWORD_RESET_MESSAGES,
} from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/validation/password-schemas";
import { z } from "zod";

/**
 * POST /api/auth/forgot-password
 *
 * Request password reset for a user account
 *
 * Security features:
 * - Rate limiting (3 attempts per hour per email)
 * - Email enumeration protection (always returns success)
 * - Validation of email format
 * - Account status checks
 * - OAuth account detection
 * - Secure token generation (32 bytes crypto random)
 *
 * @param request - Next.js request with email in body
 * @returns Generic success response (prevents email enumeration)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let email = "";

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    let validatedData;
    try {
      validatedData = forgotPasswordSchema.parse(body);
      email = validatedData.email;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return NextResponse.json(
          {
            success: false,
            message:
              firstError?.message || PASSWORD_RESET_MESSAGES.INVALID_EMAIL,
            field: firstError?.path[0],
          },
          { status: 400 },
        );
      }
      throw error;
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check rate limit BEFORE database query (prevent abuse)
    const rateLimitCheck = checkPasswordResetRateLimit(sanitizedEmail);
    if (!rateLimitCheck.allowed) {
      console.warn(
        `[FORGOT_PASSWORD] Rate limit exceeded for ${sanitizedEmail}. Attempts: ${rateLimitCheck.attempts}, Remaining time: ${rateLimitCheck.remainingTime}m`,
      );

      // Still return generic success to prevent email enumeration
      // But don't send email or touch database
      return NextResponse.json(createPasswordResetResponse(false), {
        status: 200,
      });
    }

    // Record this attempt for rate limiting
    recordPasswordResetAttempt(sanitizedEmail);

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: sanitizedEmail }).select(
      "+password +passwordResetToken +passwordResetExpiry +accountStatus +oauthProviders",
    );

    // SECURITY: Always return success to prevent email enumeration
    // Even if user doesn't exist, we return the same response
    if (!user) {
      console.info(
        `[FORGOT_PASSWORD] No user found for email: ${sanitizedEmail}`,
      );

      return NextResponse.json(createPasswordResetResponse(false), {
        status: 200,
      });
    }

    console.info(
      `[FORGOT_PASSWORD] Processing request for user: ${user._id} (${sanitizedEmail})`,
    );

    // Check if user can reset password (OAuth-only users cannot)
    const canReset = canUserResetPassword(user);
    if (!canReset.canReset) {
      console.info(
        `[FORGOT_PASSWORD] User ${user._id} cannot reset password. Reason: ${canReset.reason}`,
      );

      // For OAuth accounts, provide a hint to use social sign-in
      if (canReset.reason === "oauth_only_account") {
        return NextResponse.json(
          {
            success: true,
            message:
              "If an account exists with this email, a password reset link has been sent.",
            oauthAccount: true,
            hint: 'This account uses social sign-in. Please use "Sign in with Google" to access your account.',
          },
          { status: 200 },
        );
      }

      // Return generic success for other cases
      return NextResponse.json(createPasswordResetResponse(false), {
        status: 200,
      });
    }

    // Check account eligibility (suspended/banned accounts)
    const eligibilityCheck = isAccountEligibleForReset(user);
    if (!eligibilityCheck.eligible) {
      console.warn(
        `[FORGOT_PASSWORD] User ${user._id} not eligible. Reason: ${eligibilityCheck.reason}`,
      );

      // Return generic success (don't reveal account status)
      return NextResponse.json(createPasswordResetResponse(false), {
        status: 200,
      });
    }

    // Generate secure reset token
    const resetToken = generatePasswordResetToken();
    const resetExpiry = getPasswordResetExpiry(60); // 60 minutes

    // Save token to user document
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetExpiry;

    try {
      await user.save();
      console.info(
        `[FORGOT_PASSWORD] Reset token saved for user ${user._id}. Expires at: ${resetExpiry.toISOString()}`,
      );
    } catch (saveError: any) {
      console.error(
        `[FORGOT_PASSWORD] Failed to save reset token for user ${user._id}:`,
        saveError,
      );

      // Return generic error
      return NextResponse.json(
        {
          success: false,
          message: PASSWORD_RESET_MESSAGES.SERVER_ERROR,
        },
        { status: 500 },
      );
    }

    // Send password reset email
    let emailSent = false;
    let emailError = null;

    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetToken);
      emailSent = true;
      console.info(
        `[FORGOT_PASSWORD] Reset email sent successfully to ${sanitizedEmail}`,
      );
    } catch (error: any) {
      emailError = error;
      console.error(
        `[FORGOT_PASSWORD] Failed to send reset email to ${sanitizedEmail}:`,
        error,
      );

      // Don't fail the request if email fails
      // Token is still saved, user might retry
      // But we log this for monitoring
    }

    // Log success metrics
    const duration = Date.now() - startTime;
    console.info(
      `[FORGOT_PASSWORD] Request completed in ${duration}ms. Email sent: ${emailSent}`,
    );

    // Always return success to prevent email enumeration
    // The generic message doesn't reveal if email exists
    return NextResponse.json(createPasswordResetResponse(emailSent), {
      status: 200,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[FORGOT_PASSWORD] Unexpected error after ${duration}ms:`, {
      error: error.message,
      stack: error.stack,
      email: email || "unknown",
    });

    // Return generic error (don't expose internal details)
    return NextResponse.json(
      {
        success: false,
        message: PASSWORD_RESET_MESSAGES.SERVER_ERROR,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/auth/forgot-password
 *
 * Not allowed - return method not allowed
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed. Use POST to request password reset.",
    },
    { status: 405 },
  );
}
