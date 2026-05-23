import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import {
  validatePasswordResetToken,
  PASSWORD_RESET_MESSAGES,
} from "@/lib/password-reset";

/**
 * GET /api/auth/verify-reset-token?token=xxx
 *
 * Verify if a password reset token is valid and not expired
 *
 * This endpoint is called by the frontend to validate the token
 * before showing the password reset form to the user
 *
 * @param request - Next.js request with token in query params
 * @returns Validation result
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let tokenPreview = "";

  try {
    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          message: PASSWORD_RESET_MESSAGES.TOKEN_REQUIRED,
        },
        { status: 400 },
      );
    }

    tokenPreview = token.substring(0, 8);
    console.info(`[VERIFY_RESET_TOKEN] Verifying token: ${tokenPreview}...`);

    // Connect to database
    await connectDB();

    // Find user with this token
    const user = await User.findOne({
      passwordResetToken: token,
    }).select("+passwordResetToken +passwordResetExpiry +accountStatus");

    // Validate token
    const validation = validatePasswordResetToken(user, token);

    if (!validation.isValid) {
      console.info(
        `[VERIFY_RESET_TOKEN] Token invalid. Reason: ${validation.reason}`,
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
          valid: false,
          message,
          reason: validation.reason,
        },
        { status: 200 }, // 200 OK but valid: false
      );
    }

    // Check account status
    if (user!.accountStatus === "suspended") {
      console.warn(
        `[VERIFY_RESET_TOKEN] User account is suspended for token ${tokenPreview}...`,
      );
      return NextResponse.json(
        {
          valid: false,
          message: PASSWORD_RESET_MESSAGES.ACCOUNT_SUSPENDED,
        },
        { status: 200 },
      );
    }

    if (user!.accountStatus === "banned") {
      console.warn(
        `[VERIFY_RESET_TOKEN] User account is banned for token ${tokenPreview}...`,
      );
      return NextResponse.json(
        {
          valid: false,
          message: PASSWORD_RESET_MESSAGES.ACCOUNT_BANNED,
        },
        { status: 200 },
      );
    }

    // Token is valid
    const expiresAt = user!.passwordResetExpiry!;
    const now = new Date();
    const remainingMinutes = Math.floor(
      (expiresAt.getTime() - now.getTime()) / 1000 / 60,
    );

    const duration = Date.now() - startTime;
    console.info(
      `[VERIFY_RESET_TOKEN] Token validated successfully in ${duration}ms. Expires in ${remainingMinutes}m`,
    );

    return NextResponse.json(
      {
        valid: true,
        message: "Token is valid",
        expiresAt: expiresAt.toISOString(),
        remainingMinutes,
      },
      { status: 200 },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(
      `[VERIFY_RESET_TOKEN] Unexpected error after ${duration}ms:`,
      {
        error: error.message,
        stack: error.stack,
        token: tokenPreview || "unknown",
      },
    );

    // Return generic error
    return NextResponse.json(
      {
        valid: false,
        message: PASSWORD_RESET_MESSAGES.SERVER_ERROR,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/verify-reset-token
 *
 * Alternative method to verify token (accepts token in body)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let tokenPreview = "";

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          message: PASSWORD_RESET_MESSAGES.TOKEN_REQUIRED,
        },
        { status: 400 },
      );
    }

    tokenPreview = token.substring(0, 8);
    console.info(
      `[VERIFY_RESET_TOKEN] [POST] Verifying token: ${tokenPreview}...`,
    );

    // Connect to database
    await connectDB();

    // Find user with this token
    const user = await User.findOne({
      passwordResetToken: token,
    }).select("+passwordResetToken +passwordResetExpiry +accountStatus");

    // Validate token
    const validation = validatePasswordResetToken(user, token);

    if (!validation.isValid) {
      console.info(
        `[VERIFY_RESET_TOKEN] [POST] Token invalid. Reason: ${validation.reason}`,
      );

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
          valid: false,
          message,
          reason: validation.reason,
        },
        { status: 200 },
      );
    }

    // Check account status
    if (user!.accountStatus === "suspended") {
      return NextResponse.json(
        {
          valid: false,
          message: PASSWORD_RESET_MESSAGES.ACCOUNT_SUSPENDED,
        },
        { status: 200 },
      );
    }

    if (user!.accountStatus === "banned") {
      return NextResponse.json(
        {
          valid: false,
          message: PASSWORD_RESET_MESSAGES.ACCOUNT_BANNED,
        },
        { status: 200 },
      );
    }

    // Token is valid
    const expiresAt = user!.passwordResetExpiry!;
    const now = new Date();
    const remainingMinutes = Math.floor(
      (expiresAt.getTime() - now.getTime()) / 1000 / 60,
    );

    const duration = Date.now() - startTime;
    console.info(
      `[VERIFY_RESET_TOKEN] [POST] Token validated successfully in ${duration}ms`,
    );

    return NextResponse.json(
      {
        valid: true,
        message: "Token is valid",
        expiresAt: expiresAt.toISOString(),
        remainingMinutes,
      },
      { status: 200 },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(
      `[VERIFY_RESET_TOKEN] [POST] Unexpected error after ${duration}ms:`,
      {
        error: error.message,
        stack: error.stack,
        token: tokenPreview || "unknown",
      },
    );

    return NextResponse.json(
      {
        valid: false,
        message: PASSWORD_RESET_MESSAGES.SERVER_ERROR,
      },
      { status: 500 },
    );
  }
}
