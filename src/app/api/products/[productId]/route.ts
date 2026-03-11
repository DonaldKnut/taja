import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/products/:productId - Get product by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB();

    // Check if productId is a valid ObjectId, otherwise search by slug
    const isObjectId = mongoose.Types.ObjectId.isValid(params.productId);

    let product;
    if (isObjectId) {
      product = await Product.findById(params.productId)
        .populate('seller', 'fullName avatar email')
        .populate('shop', 'shopName shopSlug logo banner')
        .populate('category', 'name slug')
        .lean();
    } else {
      // Search by slug
      product = await Product.findOne({ slug: params.productId, status: { $ne: 'deleted' } })
        .populate('seller', 'fullName avatar email')
        .populate('shop', 'shopName shopSlug logo banner')
        .populate('category', 'name slug')
        .lean();
    }

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment views - use _id from the found product
    const productId = product._id;
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/:productId - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const product = await Product.findById(params.productId);

      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      // Check if user owns the product or is admin
      if (product.seller.toString() !== user.userId && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const allowedFields = [
        'title',
        'description',
        'longDescription',
        'category',
        'subcategory',
        'condition',
        'price',
        'maxPrice',
        'compareAtPrice',
        'images',
        'videos',
        'inventory',
        'shipping',
        'specifications',
        'seo',
        'status',
        'variants',
      ];

      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          if (field === 'inventory' || field === 'shipping' || field === 'seo') {
            // For nested objects, we want to merge but prevent learking Mongoose internals
            // Best way is to convert the existing Mongoose document to a plain object first if it exists
            const existingValue = product[field] && typeof (product[field] as any).toObject === 'function'
              ? (product[field] as any).toObject()
              : (product as any)[field];

            (product as any)[field] = { ...existingValue, ...body[field] };
          } else if (field === 'specifications') {
            // Specifications is a Map, should be replaced entirely or merged carefully
            // Replacing entirely is safer if the user sends the full set
            product.specifications = body[field];
          } else {
            (product as any)[field] = body[field];
          }
        }
      });

      await product.save();

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error: any) {
      console.error('Update product error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update product' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/products/:productId - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      // Check if productId is a valid ObjectId, otherwise search by slug
      const isObjectId = mongoose.Types.ObjectId.isValid(params.productId);
      const product = isObjectId
        ? await Product.findById(params.productId)
        : await Product.findOne({ slug: params.productId, status: { $ne: 'deleted' } });

      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      // Check if user owns the product or is admin
      if (product.seller.toString() !== user.userId && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Soft delete
      product.status = 'deleted';
      await product.save();

      return NextResponse.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete product error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete product' },
        { status: 500 }
      );
    }
  })(request);
}

