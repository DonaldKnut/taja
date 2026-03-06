import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// DELETE /api/categories/[categoryId] - Delete a category (Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { categoryId: string } }
) {
    return requireRole(['admin'])(async () => {
        try {
            const { categoryId } = params;

            if (!categoryId) {
                return NextResponse.json(
                    { success: false, message: 'Category ID is required' },
                    { status: 400 }
                );
            }

            await connectDB();

            const category = await Category.findById(categoryId);
            if (!category) {
                return NextResponse.json(
                    { success: false, message: 'Category not found' },
                    { status: 404 }
                );
            }

            // Check if it has subcategories
            if (category.subcategories && category.subcategories.length > 0) {
                return NextResponse.json(
                    { success: false, message: 'Cannot delete category with subcategories. Delete subcategories first.' },
                    { status: 400 }
                );
            }

            // If it has a parent, remove from parent's subcategories
            if (category.parent) {
                await Category.findByIdAndUpdate(category.parent, {
                    $pull: { subcategories: category._id },
                });
            }

            await Category.findByIdAndDelete(categoryId);

            return NextResponse.json({
                success: true,
                message: 'Category deleted successfully',
            });
        } catch (error: any) {
            console.error('Delete category error:', error);
            return NextResponse.json(
                { success: false, message: error.message || 'Failed to delete category' },
                { status: 500 }
            );
        }
    })(request);
}

// GET /api/categories/[categoryId] - Get a single category
export async function GET(
    request: NextRequest,
    { params }: { params: { categoryId: string } }
) {
    try {
        const { categoryId } = params;
        await connectDB();

        const category = await Category.findById(categoryId)
            .populate('parent', 'name slug')
            .populate('subcategories', 'name slug');

        if (!category) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: category,
        });
    } catch (error: any) {
        console.error('Get category error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to fetch category' },
            { status: 500 }
        );
    }
}
