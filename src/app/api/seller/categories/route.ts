import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/seller/categories - Get all categories for sellers
export async function GET(request: NextRequest) {
    return requireRole(['seller', 'admin'])(async () => {
        try {
            await connectDB();

            const categories = await Category.find({ isActive: true })
                .populate('parent', 'name slug')
                .populate('subcategories', 'name slug')
                .sort({ sortOrder: 1, name: 1 })
                .lean();

            return NextResponse.json({
                success: true,
                data: categories,
            });
        } catch (error: any) {
            console.error('Get seller categories error:', error);
            return NextResponse.json(
                { success: false, message: error.message || 'Failed to fetch categories' },
                { status: 500 }
            );
        }
    })(request);
}

// POST /api/seller/categories - Seller suggests/creates a category
export async function POST(request: NextRequest) {
    return requireRole(['seller', 'admin'])(async (req, user) => {
        try {
            const body = await request.json();
            const { name, description, image, icon, parent } = body;

            if (!name) {
                return NextResponse.json(
                    { success: false, message: 'Category name is required' },
                    { status: 400 }
                );
            }

            await connectDB();

            // Generate slug
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            // Check if slug exists
            const existingCategory = await Category.findOne({ slug });
            if (existingCategory) {
                return NextResponse.json(
                    { success: false, message: 'Category with this name already exists' },
                    { status: 400 }
                );
            }

            const category = await Category.create({
                name,
                slug,
                description,
                image,
                icon,
                parent: parent || null,
                subcategories: [],
                isActive: true, // For now, let's keep it active but we could add a 'pending' state
                sortOrder: 100, // Seller added categories at the end
            });

            // If has parent, add to parent's subcategories
            if (parent) {
                await Category.findByIdAndUpdate(parent, {
                    $push: { subcategories: category._id },
                });
            }

            return NextResponse.json(
                {
                    success: true,
                    message: 'Category created successfully',
                    data: category,
                },
                { status: 201 }
            );
        } catch (error: any) {
            console.error('Create seller category error:', error);
            return NextResponse.json(
                { success: false, message: error.message || 'Failed to create category' },
                { status: 500 }
            );
        }
    })(request);
}
