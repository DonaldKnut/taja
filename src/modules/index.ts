/**
 * Modules Index (Public API)
 *
 * Goal: keep Next.js routing under `src/app` intact, while exposing a clean,
 * feature-based import surface for everything else.
 *
 * Prefer importing from `@/modules/...` for new code.
 */

export * as auth from "./auth";
export * as email from "./email";
export * as verification from "./verification";
export * as http from "./http";
export * as db from "./db";
export * as payments from "./payments";


