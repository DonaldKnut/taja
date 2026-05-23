/** Cache-Control for public catalog responses (CDN + browser). */
export const PUBLIC_CATALOG_CACHE =
  "public, s-maxage=120, stale-while-revalidate=600, max-age=60";

/** Personalized or auth-sensitive responses — client memory only. */
export const PRIVATE_NO_CACHE = "private, no-cache, no-store, must-revalidate";

export function catalogCacheHeaders(isPersonalized: boolean): HeadersInit {
  return {
    "Cache-Control": isPersonalized ? PRIVATE_NO_CACHE : PUBLIC_CATALOG_CACHE,
    Vary: isPersonalized ? "Authorization, Cookie" : "Accept-Encoding",
  };
}
