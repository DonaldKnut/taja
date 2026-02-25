import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication (any logged-in user).
// Role checks (seller vs buyer vs admin) are done in layouts (ProtectedRoute) and API (requireRole).
// See docs/ROLE-ACCESS.md for who can access what.
const protectedRoutes = [
  "/dashboard",  // buyer (and admin)
  "/checkout",
  "/seller",     // seller only
  "/admin",      // admin only
  "/onboarding", // complete profile (OAuth users)
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to login/register pages even with token
  // This allows users to clear stale/invalid tokens
  // The login page itself will handle redirecting authenticated users if needed
  // We don't redirect here to prevent loops with invalid tokens

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

