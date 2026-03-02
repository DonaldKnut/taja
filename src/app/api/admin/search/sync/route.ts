import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware';
import { handleManualSync, syncProduct } from '@/lib/search/sync';
import { configureProductIndex } from '@/lib/algolia';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/search/sync
 * Sync products to Algolia
 * 
 * Body:
 * - type: 'single' | 'all'
 * - productId: string (required if type is 'single')
 */
export async function POST(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      const body = await request.json();
      const { type, productId } = body;

      if (!type || !['single', 'all'].includes(type)) {
        return NextResponse.json(
          { success: false, message: 'Invalid sync type. Use "single" or "all"' },
          { status: 400 }
        );
      }

      if (type === 'single' && !productId) {
        return NextResponse.json(
          { success: false, message: 'productId is required for single sync' },
          { status: 400 }
        );
      }

      const result = await handleManualSync(type, productId);

      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Sync failed' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * PUT /api/admin/search/sync
 * Configure Algolia index settings
 */
export async function PUT(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      await configureProductIndex();
      
      return NextResponse.json({
        success: true,
        message: 'Algolia index configured successfully',
      });
    } catch (error: any) {
      console.error('Configure index error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Configuration failed' },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/admin/search/sync
 * Get sync status
 */
export async function GET(request: NextRequest) {
  return requireRole(['admin'])(async (req, user) => {
    try {
      const { algoliaClient, INDICES } = await import('@/lib/algolia');
      
      if (!algoliaClient) {
        return NextResponse.json({
          success: true,
          data: {
            configured: false,
            message: 'Algolia not configured',
          },
        });
      }

      const index = algoliaClient.initIndex(INDICES.PRODUCTS);
      const stats = await index.getObject('');

      return NextResponse.json({
        success: true,
        data: {
          configured: true,
          indexName: INDICES.PRODUCTS,
          stats,
        },
      });
    } catch (error: any) {
      return NextResponse.json({
        success: true,
        data: {
          configured: false,
          error: error.message,
        },
      });
    }
  })(request);
}
