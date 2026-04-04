import { NextRequest, NextResponse } from 'next/server';
import { extractAccessTokenFromRequest } from '@/lib/auth-request-token';
import { getHomepageRecommendations } from '@/lib/ai/recommendations';
import Product from '@/models/Product';
import '@/models/Shop'; // ensure Shop model is registered for populate('shop')

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/recommendations/homepage
 * Get homepage recommendations for trending, personalized, and new arrivals
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from auth if available (optional)
    let userId: string | undefined;
    try {
      const token = extractAccessTokenFromRequest(request);
      if (token) {
        const { verifyToken } = await import('@/lib/auth');
        const decoded = verifyToken(token);
        userId = decoded.userId;
      }
    } catch {
      // Not authenticated - continue without userId
    }

    // Get recommendations
    const recommendations = await getHomepageRecommendations(userId, 8);

    // Collect all product IDs from all recommendation groups
    const allProductIds = [
      ...recommendations.trending,
      ...recommendations.personalized,
      ...recommendations.newArrivals,
    ].map(r => r.productId);

    // Fetch full product details
    const products = await Product.find({ _id: { $in: allProductIds } })
      .select('title slug price maxPrice images rating soldCount shop')
      .populate('shop', 'shopName shopSlug')
      .lean();

    // Helper function to enrich recommendations with product details
    const enrichRecommendations = (recs: any[]) => {
      return recs
        .map(rec => ({
          ...rec,
          product: products.find(p => p._id.toString() === rec.productId) || null,
        }))
        .filter(r => r.product !== null);
    };

    return NextResponse.json({
      success: true,
      data: {
        trending: enrichRecommendations(recommendations.trending),
        personalized: enrichRecommendations(recommendations.personalized),
        newArrivals: enrichRecommendations(recommendations.newArrivals),
      },
    });
  } catch (error: any) {
    console.error('[AI_RECOMMENDATIONS_HOMEPAGE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to get homepage recommendations'
      },
      { status: 500 }
    );
  }
}
