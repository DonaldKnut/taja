import crypto from "crypto";
import { IUser } from "@/models/User";

/**
 * Password Reset Token Configuration
 */
export const PASSWORD_RESET_CONFIG = {
  TOKEN_LENGTH: 32, // Length of the reset token in bytes (will be 64 hex characters)
  TOKEN_EXPIRY_MINUTES: 60, // Token valid for 60 minutes
  MAX_RESET_ATTEMPTS_PER_HOUR: 3, // Max reset requests per email per hour
  RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

/**
 * Generate a secure random token for password reset
 * @returns A cryptographically secure random token (64 hex characters)
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(PASSWORD_RESET_CONFIG.TOKEN_LENGTH).toString("hex");
}

/**
 * Calculate the expiry date for a password reset token
 * @param minutesFromNow - Number of minutes from now (default: 60)
 * @returns Date object representing when the token expires
 */
export function getPasswordResetExpiry(
  minutesFromNow: number = PASSWORD_RESET_CONFIG.TOKEN_EXPIRY_MINUTES,
): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
  return expiry;
}

/**
 * Check if a password reset token is valid and not expired
 * @param user - User document with token and expiry fields
 * @param providedToken - Token provided by the user
 * @returns Object indicating if token is valid and reason if not
 */
export function validatePasswordResetToken(
  user: IUser | null,
  providedToken: string,
): {
  isValid: boolean;
  reason?: "user_not_found" | "no_token" | "token_mismatch" | "token_expired";
} {
  if (!user) {
    return { isValid: false, reason: "user_not_found" };
  }

  if (!user.passwordResetToken || !user.passwordResetExpiry) {
    return { isValid: false, reason: "no_token" };
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenMatches = crypto.timingSafeEqual(
    Buffer.from(user.passwordResetToken),
    Buffer.from(providedToken),
  );

  if (!tokenMatches) {
    return { isValid: false, reason: "token_mismatch" };
  }

  const now = new Date();
  if (user.passwordResetExpiry < now) {
    return { isValid: false, reason: "token_expired" };
  }

  return { isValid: true };
}

/**
 * Clear password reset token and expiry from user document
 * @param user - User document to clear reset data from
 */
export function clearPasswordResetToken(user: IUser): void {
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
}

/**
 * Check if user can reset password (has a password field)
 * OAuth-only users cannot reset password
 * @param user - User document to check
 * @returns Object indicating if user can reset and reason if not
 */
export function canUserResetPassword(user: IUser): {
  canReset: boolean;
  reason?: "no_password_set" | "oauth_only_account";
} {
  if (!user.password) {
    // Check if user has OAuth providers
    const hasOAuthProvider = user.oauthProviders?.google?.id;
    if (hasOAuthProvider) {
      return { canReset: false, reason: "oauth_only_account" };
    }
    return { canReset: false, reason: "no_password_set" };
  }

  return { canReset: true };
}

/**
 * Get user-friendly error messages for password reset failures
 */
export const PASSWORD_RESET_MESSAGES = {
  // Success messages
  RESET_EMAIL_SENT:
    "If an account exists with this email, a password reset link has been sent.",
  PASSWORD_RESET_SUCCESS:
    "Your password has been reset successfully. You can now sign in with your new password.",

  // Error messages (generic for security)
  INVALID_OR_EXPIRED_TOKEN:
    "This password reset link is invalid or has expired. Please request a new one.",
  EMAIL_REQUIRED: "Email address is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_REQUIRED: "Password is required.",
  TOKEN_REQUIRED: "Reset token is required.",

  // Rate limiting
  TOO_MANY_REQUESTS:
    "Too many password reset requests. Please try again later.",

  // OAuth accounts
  OAUTH_ACCOUNT:
    'This account uses social sign-in. Please use "Sign in with Google" to access your account.',

  // Server errors
  SERVER_ERROR:
    "An error occurred while processing your request. Please try again later.",
  EMAIL_SEND_FAILED: "Unable to send reset email. Please try again later.",

  // Token validation
  TOKEN_MISMATCH:
    "The reset link is invalid. Please request a new password reset.",
  TOKEN_EXPIRED:
    "This reset link has expired. Password reset links are valid for 60 minutes.",
  NO_TOKEN_FOUND:
    "No password reset request found. Please request a new password reset.",

  // Account status
  ACCOUNT_SUSPENDED: "Your account has been suspended. Please contact support.",
  ACCOUNT_BANNED: "Your account has been banned. Please contact support.",
} as const;

/**
 * Sanitize email for security (prevent email enumeration while maintaining functionality)
 * @param email - Email to sanitize
 * @returns Sanitized email in lowercase and trimmed
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Create a generic success response for password reset requests
 * This prevents email enumeration attacks
 * @param emailActuallySent - Whether the email was actually sent (for logging only)
 * @returns Standard response object
 */
export function createPasswordResetResponse(
  emailActuallySent: boolean = false,
) {
  return {
    success: true,
    message: PASSWORD_RESET_MESSAGES.RESET_EMAIL_SENT,
    // Don't expose whether email was actually sent to client
    // But include it in response for internal logging/testing
    _emailSent: emailActuallySent,
  };
}

/**
 * Check if account is in good standing for password reset
 * @param user - User document to check
 * @returns Object indicating if account is eligible and reason if not
 */
export function isAccountEligibleForReset(user: IUser): {
  eligible: boolean;
  reason?: "suspended" | "banned" | "under_review";
  message?: string;
} {
  if (user.accountStatus === "suspended") {
    return {
      eligible: false,
      reason: "suspended",
      message: PASSWORD_RESET_MESSAGES.ACCOUNT_SUSPENDED,
    };
  }

  if (user.accountStatus === "banned") {
    return {
      eligible: false,
      reason: "banned",
      message: PASSWORD_RESET_MESSAGES.ACCOUNT_BANNED,
    };
  }

  // Allow password reset for accounts under review
  return { eligible: true };
}

/**
 * Rate limiting store for password reset requests
 * In production, use Redis or similar distributed cache
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const resetAttempts = new Map<string, RateLimitEntry>();

/**
 * Check if email has exceeded password reset rate limit
 * @param email - Email to check
 * @returns Object indicating if rate limited and remaining time
 */
export function checkPasswordResetRateLimit(email: string): {
  allowed: boolean;
  remainingTime?: number;
  attempts?: number;
} {
  const now = Date.now();
  const key = sanitizeEmail(email);
  const entry = resetAttempts.get(key);

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    resetAttempts.delete(key);
    return { allowed: true, attempts: 0 };
  }

  if (!entry) {
    return { allowed: true, attempts: 0 };
  }

  if (entry.count >= PASSWORD_RESET_CONFIG.MAX_RESET_ATTEMPTS_PER_HOUR) {
    const remainingTime = Math.ceil((entry.resetAt - now) / 1000 / 60); // minutes
    return {
      allowed: false,
      remainingTime,
      attempts: entry.count,
    };
  }

  return { allowed: true, attempts: entry.count };
}

/**
 * Record a password reset attempt for rate limiting
 * @param email - Email to record attempt for
 */
export function recordPasswordResetAttempt(email: string): void {
  const now = Date.now();
  const key = sanitizeEmail(email);
  const entry = resetAttempts.get(key);

  if (!entry || entry.resetAt < now) {
    // Start new rate limit window
    resetAttempts.set(key, {
      count: 1,
      resetAt: now + PASSWORD_RESET_CONFIG.RATE_LIMIT_WINDOW_MS,
    });
  } else {
    // Increment counter in current window
    entry.count++;
    resetAttempts.set(key, entry);
  }
}

/**
 * Clear rate limit for an email (useful after successful password reset)
 * @param email - Email to clear rate limit for
 */
export function clearPasswordResetRateLimit(email: string): void {
  const key = sanitizeEmail(email);
  resetAttempts.delete(key);
}

/**
 * Clean up expired rate limit entries periodically
 * Should be called by a cron job or scheduled task
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of resetAttempts.entries()) {
    if (entry.resetAt < now) {
      resetAttempts.delete(key);
    }
  }
}

/**
 * Complete cleanup after successful password reset
 * Clears rate limit and resets login attempts
 * @param user - User document to cleanup
 */
export function completePasswordResetCleanup(user: IUser): void {
  // Clear rate limit for this email
  clearPasswordResetRateLimit(user.email);

  // Reset login attempts and unlock account
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  // Clear reset token fields
  clearPasswordResetToken(user);
}
