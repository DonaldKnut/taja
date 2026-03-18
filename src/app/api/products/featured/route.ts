import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Shop'; // ensure Shop model is registered for populate('shop')
import '@/models/User'; // ensure User model is registered for populate('seller')
import '@/models/Category'; // ensure Category model is registered for populate('category')

export const dynamic = 'force-dynamic';

// GET /api/products/featured - Get featured products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const products = await Product.find({
      status: 'active',
      featured: true,
    })
      .populate('seller', 'fullName avatar')
      .populate('shop', 'shopName shopSlug logo')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    console.error('Get featured products error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}








