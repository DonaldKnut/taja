import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions, algoliaSearchClient } from '@/lib/algolia';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search/suggestions
 * Get search suggestions/autocomplete
 * 
 * Query params:
 * - q: partial search query
 * - limit: max suggestions (default 5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          query,
        },
      });
    }

    // If Algolia is not configured, return empty
    if (!algoliaSearchClient) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          query,
          note: 'Algolia not configured',
        },
      });
    }

    const suggestions = await getSearchSuggestions(query, limit);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        query,
      },
    });
  } catch (error: any) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
