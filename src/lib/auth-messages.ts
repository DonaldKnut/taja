/**
 * User-friendly messages for auth errors (sign-in, sign-up, OAuth).
 * Used so every response shows a clear, consistent toast.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // OAuth / Google
  access_denied: "Sign-in was cancelled. Try again when you're ready.",
  invalid_request: "Invalid sign-in request. Please try again.",
  oauth_failed: "Sign-in with Google failed. Please try again or use email.",
  invalid_token: "Session expired or invalid. Please sign in again.",
  no_email: "We couldn't get your email from Google. Please use email sign-in.",
  invalid_callback: "Something went wrong during sign-in. Please try again.",
  failed_to_load_user: "We couldn't load your account. Please sign in again.",
  callback_error: "Sign-in didn't complete. Please try again.",
  // Network / DB (e.g. querySrv ECONNREFUSED)
  "querySrv ECONNREFUSED _mongodb._tcp.taja.m0zmmou.mongodb.net":
    "Connection issue. Check your internet or try again in a moment.",
  // MongoDB Atlas unreachable (login/register/OAuth)
  db_unavailable:
    "Database is temporarily unavailable. Check your internet, firewall, or try again in a moment.",
  // Generic
  default: "Something went wrong. Please try again.",
};

const DB_CONNECTION_PHRASES = [
  "could not connect to any servers",
  "whitelist",
  "mongooseserverselectionerror",
  "econnrefused",
  "querysrv",
];

export function getAuthErrorMessage(errorCode: string | null | undefined): string {
  if (!errorCode || typeof errorCode !== "string") return AUTH_ERROR_MESSAGES.default;
  const trimmed = errorCode.trim();
  if (AUTH_ERROR_MESSAGES[trimmed]) return AUTH_ERROR_MESSAGES[trimmed];
  const lower = trimmed.toLowerCase();
  if (DB_CONNECTION_PHRASES.some((p) => lower.includes(p))) return AUTH_ERROR_MESSAGES.db_unavailable;
  if (trimmed.includes("querySrv") || trimmed.includes("ECONNREFUSED")) return AUTH_ERROR_MESSAGES["querySrv ECONNREFUSED _mongodb._tcp.taja.m0zmmou.mongodb.net"];
  return AUTH_ERROR_MESSAGES.default;
}
