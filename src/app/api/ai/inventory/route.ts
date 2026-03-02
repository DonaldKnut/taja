import { NextRequest, NextResponse } from 'next/server';
import { generateInventoryAlerts, getInventorySummary, getDemandForecast } from '@/lib/ai/inventoryAlerts';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/inventory/alerts
 * Get AI-powered inventory alerts
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const alerts = await generateInventoryAlerts(user.userId);

      return NextResponse.json({
        success: true,
        data: {
          alerts,
          totalAlerts: alerts.length,
          highPriority: alerts.filter(a => a.priority === 'high').length,
          mediumPriority: alerts.filter(a => a.priority === 'medium').length,
          lowPriority: alerts.filter(a => a.priority === 'low').length,
        },
      });
    } catch (error: any) {
      console.error('Inventory alerts error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get alerts' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/ai/inventory/summary
 * Get inventory dashboard summary
 */
export async function GET_SUMMARY(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const summary = await getInventorySummary(user.userId);

      return NextResponse.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Inventory summary error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get summary' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/ai/inventory/forecast/:productId
 * Get demand forecast for a product
 */
export async function GET_FORECAST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const days = parseInt(searchParams.get('days') || '30');

      const forecast = await getDemandForecast(params.productId, days);

      return NextResponse.json({
        success: true,
        data: forecast,
      });
    } catch (error: any) {
      console.error('Demand forecast error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get forecast' },
        { status: 500 }
      );
    }
  })(request);
}
