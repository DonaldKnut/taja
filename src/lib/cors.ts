/**
 * CORS Helper for Next.js API Routes
 * Adds CORS headers to API responses for cross-origin requests
 */

import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://tajaapp.shop',
  process.env.NEXTAUTH_URL || 'https://tajaapp.shop',
  'https://tajaapp.shop',
  'http://localhost:3000',
].filter(Boolean);

/**
 * Add CORS headers to a NextResponse
 */
export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  // Determine allowed origin
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleCorsPreflight(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(
  data: any,
  status: number = 200,
  origin?: string | null
): NextResponse {
  const response = NextResponse.json(data, { status });
  return addCorsHeaders(response, origin);
}


