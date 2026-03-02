import { NextRequest, NextResponse } from 'next/server';
import { autoConfirmHandler } from '@/lib/jobs/autoConfirmOrders';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/auto-confirm
 * Cron job endpoint for auto-confirming orders
 * 
 * This should be called periodically (e.g., every hour) by:
 * - Vercel Cron Jobs
 * - AWS EventBridge
 * - GitHub Actions
 * - Any scheduler
 * 
 * Security: Should be protected by a secret key in production
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production, require auth
      // For now, just log and continue (allow manual triggers)
      console.log('[Cron] Auto-confirm triggered without auth (development mode)');
    }

    const result = await autoConfirmHandler();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron] Auto-confirm failed:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Job failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/auto-confirm
 * Alternative endpoint for POST-based cron jobs
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
