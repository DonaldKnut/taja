import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests', keyGenerator } = options;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();
    const record = store[key];

    // Clean up expired records
    if (record && record.resetTime < now) {
      delete store[key];
    }

    const current = store[key];

    if (!current) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return null; // Allow request
    }

    if (current.count >= max) {
      return NextResponse.json(
        {
          success: false,
          message,
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
          },
        }
      );
    }

    current.count++;
    return null; // Allow request
  };
}

// Pre-configured rate limiters
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req) => req.ip || 'unknown',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req) => req.ip || 'unknown',
});

export const emailVerificationRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 1,
  message: 'Please wait before requesting another verification code.',
  keyGenerator: (req) => {
    const body = req.body as any;
    return body?.email || req.ip || 'unknown';
  },
});








