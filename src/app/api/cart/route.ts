import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function isValidPositiveInt(value: any): boolean {
  return Number.isInteger(value) && value >= 1;
}

function resolveVariant(product: any, variantId?: string) {
  if (!variantId) return null;
  const variant = (product?.variants || []).find((v: any) => String(v?._id) === String(variantId));
  return variant || null;
}

function getUnitPrice(product: any, variant: any) {
  if (variant && typeof variant.price === 'number') return variant.price;
  return product?.price || 0;
}

function getAvailableStock(product: any, variant: any) {
  if (variant && typeof variant.stock === 'number') return variant.stock;
  const track = product?.inventory?.trackQuantity !== false;
  if (!track) return Number.MAX_SAFE_INTEGER;
  return product?.inventory?.quantity ?? 0;
}

async function buildCartResponse(cart: any) {
  const productIds = cart.items.map((i: any) => i.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('title price images inventory variants status')
    .lean();
  const productMap = new Map(products.map((p: any) => [String(p._id), p]));

  const items = cart.items.map((item: any) => {
    const product = productMap.get(String(item.product));
    const variant = resolveVariant(product, item.variantId);
    const unitPrice = getUnitPrice(product, variant);
    const stock = getAvailableStock(product, variant);
    const moq = product?.inventory?.moq ?? 1;
    return {
      itemId: String(item._id),
      productId: String(item.product),
      title: variant?.name || product?.title || 'Product',
      unitPrice,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
      stock: Number.isFinite(stock) ? stock : 999999,
      moq,
      images: variant?.image ? [variant.image, ...(product?.images || [])] : (product?.images || []),
      variantId: item.variantId || undefined,
      variantName: item.variantName || variant?.name || undefined,
    };
  });

  const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0);
  cart.totals.subtotal = subtotal;
  cart.totals.total = subtotal + cart.totals.shipping + cart.totals.tax - cart.totals.discount;
  await cart.save();

  return {
    success: true,
    data: {
      items,
      totals: {
        subtotal: cart.totals.subtotal,
        total: cart.totals.total,
      },
    },
  };
}

// GET /api/cart - Get user cart
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      let cart = await Cart.findOne({ user: user.userId });

      if (!cart) {
        cart = await Cart.create({
          user: user.userId,
          items: [],
          totals: {
            subtotal: 0,
            shipping: 0,
            tax: 0,
            discount: 0,
            total: 0,
          },
        });
      }

      return NextResponse.json(await buildCartResponse(cart));
    } catch (error: any) {
      console.error('Get cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch cart' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/cart - Add to cart
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { productId, quantity = 1, variantId, variantName } = body || {};

      if (!productId) {
        return NextResponse.json(
          { success: false, message: 'Validation error: productId is required' },
          { status: 400 }
        );
      }
      if (!mongoose.Types.ObjectId.isValid(String(productId))) {
        return NextResponse.json(
          { success: false, message: 'Validation error: productId must be a valid ObjectId' },
          { status: 400 }
        );
      }
      const normalizedQuantity = Number(quantity);
      if (!isValidPositiveInt(normalizedQuantity)) {
        return NextResponse.json(
          { success: false, message: 'Validation error: quantity must be >= 1' },
          { status: 400 }
        );
      }

      await connectDB();

      // Verify product exists and is available
      const product = await Product.findById(productId);
      if (!product || product.status !== 'active') {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      const selectedVariant = resolveVariant(product, variantId);
      if (variantId && !selectedVariant) {
        return NextResponse.json(
          { success: false, message: 'Variant does not belong to product' },
          { status: 400 }
        );
      }
      if (selectedVariant && selectedVariant.active === false) {
        return NextResponse.json(
          { success: false, message: 'Variant is inactive' },
          { status: 400 }
        );
      }

      // Deterministic stock and MOQ checks
      const availableStock = getAvailableStock(product, selectedVariant);
      const moq = product.inventory?.moq ?? 1;
      if (normalizedQuantity < moq) {
        return NextResponse.json(
          { success: false, message: `Validation error: quantity must be >= ${moq}` },
          { status: 400 }
        );
      }
      if (availableStock < normalizedQuantity) {
        return NextResponse.json(
          { success: false, message: 'Insufficient stock' },
          { status: 400 }
        );
      }

      let cart = await Cart.findOne({ user: user.userId });

      if (!cart) {
        cart = await Cart.create({
          user: user.userId,
          items: [],
          totals: {
            subtotal: 0,
            shipping: 0,
            tax: 0,
            discount: 0,
            total: 0,
          },
        });
      }

      // Check if product already in cart
      const existingItem = cart.items.find(
        (item: any) =>
          item.product.toString() === String(productId) &&
          String(item.variantId || '') === String(variantId || '')
      );

      if (existingItem) {
        const nextQuantity = existingItem.quantity + normalizedQuantity;
        if (nextQuantity > availableStock) {
          return NextResponse.json(
            { success: false, message: 'Insufficient stock' },
            { status: 400 }
          );
        }
        existingItem.quantity = nextQuantity;
      } else {
        cart.items.push({
          product: productId,
          quantity: normalizedQuantity,
          variantId: variantId || undefined,
          variantName: variantName || selectedVariant?.name || undefined,
          addedAt: new Date(),
        });
      }

      return NextResponse.json(await buildCartResponse(cart));
    } catch (error: any) {
      console.error('Add to cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to add to cart' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/cart - Clear cart
export async function DELETE(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      await Cart.findOneAndUpdate(
        { user: user.userId },
        {
          items: [],
          totals: {
            subtotal: 0,
            shipping: 0,
            tax: 0,
            discount: 0,
            total: 0,
          },
          coupon: undefined,
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          items: [],
          totals: { subtotal: 0, total: 0 },
        },
      });
    } catch (error: any) {
      console.error('Clear cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to clear cart' },
        { status: 500 }
      );
    }
  })(request);
}








