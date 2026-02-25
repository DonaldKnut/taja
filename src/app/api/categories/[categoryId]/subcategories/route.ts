import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

// GET /api/categories/:categoryId/subcategories - Get subcategories
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    await connectDB();

    const category = await Category.findById(params.categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    const subcategories = await Category.find({
      parent: params.categoryId,
      isActive: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: subcategories,
    });
  } catch (error: any) {
    console.error('Get subcategories error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch subcategories' },
      { status: 500 }
    );
  }
}
