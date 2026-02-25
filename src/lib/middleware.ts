import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function authenticate(
  request: NextRequest
): Promise<{ user: JWTPayload | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Verify user still exists and is active; use role from DB so Compass/DB updates apply without re-login
    await connectDB();
    const userDoc = await User.findById(decoded.userId).select('accountStatus email role');

    if (!userDoc) {
      return { user: null, error: 'User not found' };
    }

    if (userDoc.accountStatus !== 'active') {
      return { user: null, error: 'Account is not active' };
    }

    return {
      user: {
        userId: decoded.userId,
        email: userDoc.email ?? decoded.email,
        role: userDoc.role ?? decoded.role,
      },
      error: null,
    };
  } catch (error: any) {
    return { user: null, error: error.message || 'Invalid token' };
  }
}

export function requireAuth(handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const { user, error } = await authenticate(req);

    if (!user || error) {
      return NextResponse.json(
        { success: false, message: error || 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

export function requireRole(allowedRoles: string[]) {
  return (handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const { user, error } = await authenticate(req);

      if (!user || error) {
        return NextResponse.json(
          { success: false, message: error || 'Authentication required' },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, user);
    };
  };
}








