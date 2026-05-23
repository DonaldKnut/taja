import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogCategory from '@/models/BlogCategory';
import { requireRole } from '@/lib/middleware';
import { slugify } from '@/lib/slugify';

export const dynamic = 'force-dynamic';

async function uniqueCategorySlug(base: string): Promise<string> {
  const b = base || 'category';
  for (let n = 0; n < 1000; n += 1) {
    const candidate = n === 0 ? b : `${b}-${n}`;
    const exists = await BlogCategory.findOne({ slug: candidate }).lean();
    if (!exists) return candidate;
  }
  return `${b}-${Date.now()}`;
}

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

      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        return NextResponse.json(
          { success: false, message: 'Category name is required' },
          { status: 400 }
        );
      }

      const baseSlug = body.slug && typeof body.slug === 'string' && body.slug.trim()
        ? slugify(body.slug.trim())
        : slugify(name);
      const slug = await uniqueCategorySlug(baseSlug);

      const color =
        typeof body.color === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(body.color.trim())
          ? body.color.trim()
          : '#10B981';

      const category = await BlogCategory.create({
        name,
        slug,
        color,
        description: typeof body.description === 'string' ? body.description.slice(0, 500) : undefined,
        isActive: true,
        sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
      });

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
