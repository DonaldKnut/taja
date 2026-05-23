/**
 * lib barrel exports
 *
 * Non-breaking: existing imports like `@/lib/email` still work.
 * New code can import from `@/lib` (or better, `@/modules/...`).
 */

export * from "./analytics";
export * from "./api";
export * from "./auth";
export * from "./cloudflare";
export * from "./cors";
export { default as connectDB } from "./db";
export * from "./email";
export * from "./gemini";
export * from "./identityVerification";
export * from "./imageProcessing";
export * from "./middleware";
export * from "./notifications";
export * from "./payments";
export * from "./r2";
export * from "./rateLimit";
export * from "./seo";
export * from "./socket";
export * from "./utils";


