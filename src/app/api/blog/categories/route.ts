import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogCategory from '@/models/BlogCategory';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blog/categories
 * List all blog categories (public)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const categories = await BlogCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Get blog categories error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/categories
 * Create new category (admin only)
 */
export async function POST(request: NextRequest) {
  return requireRole(['admin', 'editor'])(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      
      if (!body.name) {
        return NextResponse.json(
          { success: false, message: 'Category name is required' },
          { status: 400 }
        );
      }

      const category = await BlogCategory.create(body);

      return NextResponse.json({
        success: true,
        message: 'Category created successfully',
        data: category,
      }, { status: 201 });
    } catch (error: any) {
      console.error('Create category error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create category' },
        { status: 500 }
      );
    }
  })(request);
}
