import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

// GET /api/search - Unified search across products, shops, and categories
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'products', 'shops', 'categories'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const searchTerm = query.trim();
    const results: any = {
      products: [],
      shops: [],
      categories: [],
    };

    // Search products
    if (type === 'all' || type === 'products') {
      const productQuery: any = {
        status: 'active',
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { 'specifications.brand': { $regex: searchTerm, $options: 'i' } },
        ],
      };

      // Try text search if available
      try {
        const textSearchProducts = await Product.find({
          ...productQuery,
          $text: { $search: searchTerm },
        })
          .populate('shop', 'shopName shopSlug logo')
          .populate('category', 'name slug')
          .limit(limit)
          .lean();

        if (textSearchProducts.length > 0) {
          results.products = textSearchProducts;
        } else {
          // Fallback to regex search
          results.products = await Product.find(productQuery)
            .populate('shop', 'shopName shopSlug logo')
            .populate('category', 'name slug')
            .limit(limit)
            .lean();
        }
      } catch (error) {
        // Fallback to regex search if text index not available
        results.products = await Product.find(productQuery)
          .populate('shop', 'shopName shopSlug logo')
          .populate('category', 'name slug')
          .limit(limit)
          .lean();
      }
    }

    // Search shops
    if (type === 'all' || type === 'shops') {
      results.shops = await Shop.find({
        status: 'active',
        $or: [
          { shopName: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ],
      })
        .populate('owner', 'fullName avatar')
        .limit(limit)
        .lean();
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      results.categories = await Category.find({
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ],
      })
        .limit(limit)
        .lean();
    }

    const totalResults =
      results.products.length + results.shops.length + results.categories.length;

    return NextResponse.json({
      success: true,
      data: {
        query: searchTerm,
        results,
        counts: {
          products: results.products.length,
          shops: results.shops.length,
          categories: results.categories.length,
          total: totalResults,
        },
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to perform search' },
      { status: 500 }
    );
  }
}






