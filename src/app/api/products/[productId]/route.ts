import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import { authenticate, requireAuth } from '@/lib/middleware';
import '@/models/Category'; // Ensure Category model is registered for populate('category')
import { notifyOwnerViewAlert } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';

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

    // Notify seller that their product is being viewed (throttled per viewer + product).
    try {
      const auth = await authenticate(request);
      const sellerId =
        typeof product.seller === 'object' && product.seller?._id
          ? String(product.seller._id)
          : String((product as any).seller);
      const viewerUserId = auth.user?.userId ? String(auth.user.userId) : null;
      const viewerName = auth.user?.fullName || undefined;
      const forwardedFor = request.headers.get('x-forwarded-for') || '';
      const ip = forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
      const ua = request.headers.get('user-agent') || 'unknown-ua';
      const anonViewerKey = `anon:${ip}:${ua.slice(0, 80)}`;
      const viewerKey = viewerUserId ? `user:${viewerUserId}` : anonViewerKey;

      if (sellerId && viewerUserId !== sellerId) {
        await notifyOwnerViewAlert({
          ownerUserId: sellerId,
          entityType: 'product',
          entityId: String(productId),
          entityName: (product as any).title,
          entitySlug: (product as any).slug,
          viewerName,
          viewerKey,
        });
      }
    } catch (notifyError) {
      console.error('Product view notification error:', notifyError);
    }

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

      // Clean variants: drop any empty rows without a name to avoid validation errors
      if (Array.isArray(body.variants)) {
        body.variants = body.variants.filter(
          (v: any) => v && typeof v.name === 'string' && v.name.trim().length > 0
        );
      }
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
          } else if (field === 'maxPrice' && body[field] === null) {
            // Clear legacy product-level max range; do not store null on a Number path
            product.set('maxPrice', undefined);
          } else {
            (product as any)[field] = body[field];
          }
        }
      });

      await product.save();

      if (body.maxPrice === null) {
        await Product.updateOne({ _id: product._id }, { $unset: { maxPrice: 1 } });
      }

      await writeAuditLog({
        request,
        actorUserId: user.userId,
        actorRole: user.role,
        action: 'product.update',
        entityType: 'product',
        entityId: String(product._id),
        metadata: {
          status: product.status,
          price: product.price,
          imageCount: Array.isArray(product.images) ? product.images.length : 0,
          videoCount: Array.isArray((product as any).videos) ? (product as any).videos.length : 0,
        },
      });

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

      await writeAuditLog({
        request,
        actorUserId: user.userId,
        actorRole: user.role,
        action: 'product.delete',
        entityType: 'product',
        entityId: String(product._id),
        metadata: { slug: product.slug, title: product.title },
      });

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

