import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getSearchSuggestions, algoliaSearchClient, INDICES } from '@/lib/algolia';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search
 * Search products with filters
 * 
 * Query params:
 * - q: search query
 * - category: category slug
 * - shop: shop slug
 * - minPrice: minimum price
 * - maxPrice: maximum price
 * - rating: minimum rating (1-5)
 * - state: location state
 * - sort: sort option (relevance, price_asc, price_desc, newest, popular, rating)
 * - page: page number (0-based)
 * - limit: items per page
 * - available: only show available items (true/false)
 * - discount: only show discounted items (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const shop = searchParams.get('shop');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = searchParams.get('rating');
    const state = searchParams.get('state');
    const sortBy = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const available = searchParams.get('available') === 'true';
    const discount = searchParams.get('discount') === 'true';

    // Build filters
    const filters: string[] = [];
    
    if (category) {
      filters.push(`category.slug:${category}`);
    }
    
    if (shop) {
      filters.push(`shop.shopSlug:${shop}`);
    }
    
    if (minPrice || maxPrice) {
      const priceFilters: string[] = [];
      if (minPrice) priceFilters.push(`price >= ${minPrice}`);
      if (maxPrice) priceFilters.push(`price <= ${maxPrice}`);
      filters.push(priceFilters.join(' AND '));
    }
    
    if (rating) {
      filters.push(`rating >= ${rating}`);
    }
    
    if (state) {
      filters.push(`location.state:${state}`);
    }
    
    if (available) {
      filters.push('isAvailable:true');
    }
    
    if (discount) {
      filters.push('hasDiscount:true');
    }

    // If Algolia is not configured, fall back to MongoDB search
    if (!algoliaSearchClient) {
      return fallbackSearch({
        query,
        category,
        shop,
        minPrice,
        maxPrice,
        rating,
        state,
        sortBy,
        page,
        limit,
        available,
        discount,
      });
    }

    // Search with Algolia
    const result = await searchProducts(query, {
      filters: filters.length > 0 ? filters.join(' AND ') : undefined,
      page,
      hitsPerPage: limit,
      sortBy: sortBy !== 'relevance' ? sortBy : undefined,
      facets: ['category.slug', 'shop.shopSlug', 'priceRange', 'rating'],
    });

    return NextResponse.json({
      success: true,
      data: {
        products: result.hits,
        pagination: {
          page: result.page,
          pages: result.nbPages,
          total: result.nbHits,
          limit: result.hitsPerPage,
        },
        facets: result.facets,
        query: result.query,
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * Fallback search using MongoDB (when Algolia is not configured)
 */
async function fallbackSearch(params: any) {
  try {
    const { default: connectDB } = await import('@/lib/db');
    const { default: Product } = await import('@/models/Product');
    
    await connectDB();

    const query: any = { status: 'active' };

    // Text search
    if (params.query) {
      query.$or = [
        { title: { $regex: params.query, $options: 'i' } },
        { description: { $regex: params.query, $options: 'i' } },
        { tags: { $in: [new RegExp(params.query, 'i')] } },
      ];
    }

    // Filters
    if (params.category) {
      query['category.slug'] = params.category;
    }

    if (params.minPrice || params.maxPrice) {
      query.price = {};
      if (params.minPrice) query.price.$gte = parseFloat(params.minPrice);
      if (params.maxPrice) query.price.$lte = parseFloat(params.maxPrice);
    }

    if (params.rating) {
      query['rating.average'] = { $gte: parseFloat(params.rating) };
    }

    if (params.available) {
      query.quantity = { $gt: 0 };
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    switch (params.sortBy) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { soldCount: -1 };
        break;
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
    }

    const skip = params.page * params.limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('shop', 'shopName shopSlug logo')
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page: params.page,
          pages: Math.ceil(total / params.limit),
          total,
          limit: params.limit,
        },
        facets: {},
        query: params.query,
      },
      note: 'Using fallback MongoDB search. Configure Algolia for better search.',
    });
  } catch (error: any) {
    console.error('Fallback search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
