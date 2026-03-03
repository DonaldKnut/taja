import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import {
  validatePasswordResetToken,
  clearPasswordResetToken,
  PASSWORD_RESET_MESSAGES,
  clearPasswordResetRateLimit,
} from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validation/password-schemas";
import { z } from "zod";

/**
 * POST /api/auth/reset-password
 *
 * Reset user password using a valid reset token
 *
 * Security features:
 * - Token validation (timing-safe comparison)
 * - Token expiry check (60 minutes)
 * - Password strength validation
 * - Password hashing (bcrypt)
 * - Token cleanup after use
 * - Rate limit cleanup after successful reset
 * - Account status checks
 * - Comprehensive logging
 *
 * @param request - Next.js request with token and password in body
 * @returns Success/error response with appropriate status
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId = "";

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    let validatedData;
    try {
      validatedData = resetPasswordSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return NextResponse.json(
          {
            success: false,
            message: firstError?.message || "Invalid input",
            field: firstError?.path[0],
            errors: error.errors.map((e) => ({
              field: e.path[0],
              message: e.message,
            })),
          },
          { status: 400 },
        );
      }
      throw error;
    }

    const { token, password } = validatedData;

    console.info(
      `[RESET_PASSWORD] Processing reset request with token: ${token.substring(0, 8)}...`,
    );

    // Connect to database
    await connectDB();

    // Find user with matching reset token
    // Use select to include password field (usually excluded)
    const user = await User.findOne({
      passwordResetToken: token,
    }).select(
      "+password +passwordResetToken +passwordResetExpiry +accountStatus",
    );

    // Validate token
    const validation = validatePasswordResetToken(user, token);

    if (!validation.isValid) {
      console.warn(
        `[RESET_PASSWORD] Token validation failed. Reason: ${validation.reason}`,
      );

      // Map validation reason to user-friendly message
      let message = PASSWORD_RESET_MESSAGES.INVALID_OR_EXPIRED_TOKEN;

      switch (validation.reason) {
        case "user_not_found":
        case "no_token":
        case "token_mismatch":
        case "token_expired":
          message = PASSWORD_RESET_MESSAGES.INVALID_OR_EXPIRED_TOKEN;
          break;
      }

      return NextResponse.json(
        {
          success: false,
          message,
          reason: validation.reason,
        },
        { status: 400 },
      );
    }

    userId = user!._id.toString();
    console.info(`[RESET_PASSWORD] Valid token found for user: ${userId}`);

    // Check account status
    if (user!.accountStatus === "suspended") {
      console.warn(`[RESET_PASSWORD] User ${userId} account is suspended`);
      return NextResponse.json(
        {
          success: false,
          message: PASSWORD_RESET_MESSAGES.ACCOUNT_SUSPENDED,
        },
        { status: 403 },
      );
    }

    if (user!.accountStatus === "banned") {
      console.warn(`[RESET_PASSWORD] User ${userId} account is banned`);
      return NextResponse.json(
        {
          success: false,
          message: PASSWORD_RESET_MESSAGES.ACCOUNT_BANNED,
        },
        { status: 403 },
      );
    }

    // Hash the new password
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
      console.info(
        `[RESET_PASSWORD] Password hashed successfully for user ${userId}`,
      );
    } catch (hashError: any) {
      console.error(
        `[RESET_PASSWORD] Password hashing failed for user ${userId}:`,
        hashError,
      );
      return NextResponse.json(
        {
          success: false,
          message: PASSWORD_RESET_MESSAGES.SERVER_ERROR,
        },
        { status: 500 },
      );
    }

    // Update password and clear reset token
    user!.password = hashedPassword;
    clearPasswordResetToken(user!);

    // Reset login attempts (if any)
    user!.loginAttempts = 0;
    user!.lockUntil = undefined;

    // Save updated user
    try {
      await user!.save();
      console.info(
        `[RESET_PASSWORD] Password updated successfully for user ${userId}`,
      );
    } catch (saveError: any) {
      console.error(
        `[RESET_PASSWORD] Failed to save new password for user ${userId}:`,
        saveError,
      );
      return NextResponse.json(
        {
          success: false,
          message: PASSWORD_RESET_MESSAGES.SERVER_ERROR,
        },
        { status: 500 },
      );
    }

    // Clear rate limit for this email (successful reset)
    clearPasswordResetRateLimit(user!.email);
    console.info(`[RESET_PASSWORD] Rate limit cleared for ${user!.email}`);

    // Log success metrics
    const duration = Date.now() - startTime;
    console.info(
      `[RESET_PASSWORD] Password reset completed successfully in ${duration}ms for user ${userId}`,
    );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: PASSWORD_RESET_MESSAGES.PASSWORD_RESET_SUCCESS,
      },
      { status: 200 },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[RESET_PASSWORD] Unexpected error after ${duration}ms:`, {
      error: error.message,
      stack: error.stack,
      userId: userId || "unknown",
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
 * GET /api/auth/reset-password
 *
 * Not allowed - return method not allowed
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed. Use POST to reset password.",
    },
    { status: 405 },
  );
}
