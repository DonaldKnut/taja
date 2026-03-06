import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Category'; // Ensure registered for populate
import '@/models/Shop';     // Ensure registered for populate
import '@/models/User';     // Ensure registered for populate
export const dynamic = 'force-dynamic';

// GET /api/products/slug/:slug - Get product by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const product = await Product.findOne({ slug: params.slug, status: 'active' })
      .populate('seller', 'fullName avatar email')
      .populate('shop', 'shopName shopSlug logo banner')
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment views
    await Product.findOneAndUpdate({ slug: params.slug }, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Get product by slug error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}








