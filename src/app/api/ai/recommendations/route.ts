import { NextRequest, NextResponse } from 'next/server';
import { extractAccessTokenFromRequest } from '@/lib/auth-request-token';
import { getRecommendations, getHomepageRecommendations, recordProductView } from '@/lib/ai/recommendations';
import { requireAuth } from '@/lib/middleware';
import Product from '@/models/Product';
import '@/models/Shop'; // ensure Shop model is registered for populate('shop')

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/recommendations
 * Get product recommendations
 * 
 * Query params:
 * - type: similar | frequently_bought | trending | personalized | cross_sell | upsell
 * - productId: product ID (required for most types)
 * - limit: number of recommendations (default 8)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any || 'trending';
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '8');
    
    // Get user ID from auth if available
    let userId: string | undefined;
    try {
      const token = extractAccessTokenFromRequest(request);
      if (token) {
        const { verifyToken } = await import('@/lib/auth');
        const decoded = verifyToken(token);
        userId = decoded.userId;
      }
    } catch {
      // Not authenticated, continue without userId
    }

    // Validate type
    const validTypes = ['similar', 'frequently_bought', 'trending', 'personalized', 'cross_sell', 'upsell'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid recommendation type' },
        { status: 400 }
      );
    }

    // Validate productId for types that need it
    const typesRequiringProduct = ['similar', 'frequently_bought', 'cross_sell', 'upsell'];
    if (typesRequiringProduct.includes(type) && !productId) {
      return NextResponse.json(
        { success: false, message: 'productId is required for this recommendation type' },
        { status: 400 }
      );
    }

    const recommendations = await getRecommendations(productId, {
      type,
      limit,
      userId,
    });

    // Fetch full product details
    const productIds = recommendations.map(r => r.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select('title slug price images rating soldCount shop')
      .populate('shop', 'shopName shopSlug')
      .lean();

    // Merge recommendations with product details
    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p._id.toString() === rec.productId);
      return {
        ...rec,
        product: product || null,
      };
    }).filter(r => r.product !== null);

    return NextResponse.json({
      success: true,
      data: {
        type,
        recommendations: enrichedRecommendations,
      },
    });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/recommendations/homepage
 * Get homepage recommendations
 */
export async function GET_HOMEPAGE(request: NextRequest) {
  try {
    let userId: string | undefined;
    try {
      const token = extractAccessTokenFromRequest(request);
      if (token) {
        const { verifyToken } = await import('@/lib/auth');
        const decoded = verifyToken(token);
        userId = decoded.userId;
      }
    } catch {
      // Not authenticated
    }

    const recommendations = await getHomepageRecommendations(userId, 8);

    // Fetch product details for all recommendations
    const allProductIds = [
      ...recommendations.trending,
      ...recommendations.personalized,
      ...recommendations.newArrivals,
    ].map(r => r.productId);

    const products = await Product.find({ _id: { $in: allProductIds } })
      .select('title slug price images rating soldCount shop')
      .populate('shop', 'shopName shopSlug')
      .lean();

    // Enrich all recommendation groups
    const enrich = (recs: any[]) => recs.map(rec => ({
      ...rec,
      product: products.find(p => p._id.toString() === rec.productId) || null,
    })).filter(r => r.product !== null);

    return NextResponse.json({
      success: true,
      data: {
        trending: enrich(recommendations.trending),
        personalized: enrich(recommendations.personalized),
        newArrivals: enrich(recommendations.newArrivals),
      },
    });
  } catch (error: any) {
    console.error('Homepage recommendations error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/recommendations/view
 * Record product view for analytics
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { productId } = body;

      if (!productId) {
        return NextResponse.json(
          { success: false, message: 'productId is required' },
          { status: 400 }
        );
      }

      await recordProductView(productId, user.userId);

      return NextResponse.json({
        success: true,
        message: 'View recorded',
      });
    } catch (error: any) {
      console.error('Record view error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to record view' },
        { status: 500 }
      );
    }
  })(request);
}
