/**
 * Shape compatible with Next.js `NextRequest` for access-token extraction.
 */
export type RequestWithTokenSources = {
  headers: { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
};

/**
 * Access token for API auth: prefer `Authorization: Bearer <jwt>` (scheme is case-insensitive;
 * some mobile clients send `bearer`). Falls back to the `token` cookie set on login for parity
 * with browser clients that rely on cookies.
 */
export function extractAccessTokenFromRequest(request: RequestWithTokenSources): string | null {
  const raw = request.headers.get('authorization')?.trim();
  if (raw) {
    const m = raw.match(/^Bearer\s+(.+)$/i);
    const fromHeader = m?.[1]?.trim();
    if (fromHeader) return fromHeader;
  }
  const fromCookie = request.cookies.get('token')?.value?.trim();
  return fromCookie || null;
}
