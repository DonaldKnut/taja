import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

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

// PUT /api/cart/:itemId - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { quantity } = body || {};

      const normalizedQuantity = Number(quantity);
      if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
        return NextResponse.json(
          { success: false, message: 'Validation error: quantity must be >= 1' },
          { status: 400 }
        );
      }

      await connectDB();

      const cart = await Cart.findOne({ user: user.userId });
      if (!cart) {
        return NextResponse.json(
          { success: false, message: 'Cart not found' },
          { status: 404 }
        );
      }

      const item = cart.items.find(
        (item: any) => item._id.toString() === params.itemId
      );
      if (!item) {
        return NextResponse.json(
          { success: false, message: 'Item not found in cart' },
          { status: 404 }
        );
      }

      // Check stock
      const product = await Product.findById(item.product);
      const selectedVariant = resolveVariant(product, item.variantId);
      const availableStock = getAvailableStock(product, selectedVariant);
      if (availableStock < normalizedQuantity) {
        return NextResponse.json(
          { success: false, message: 'Insufficient stock' },
          { status: 400 }
        );
      }
      const moq = product?.inventory?.moq ?? 1;
      if (normalizedQuantity < moq) {
        return NextResponse.json(
          { success: false, message: `Validation error: quantity must be >= ${moq}` },
          { status: 400 }
        );
      }

      item.quantity = normalizedQuantity;
      return NextResponse.json(await buildCartResponse(cart));
    } catch (error: any) {
      console.error('Update cart item error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update cart item' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/cart/:itemId - Remove from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const cart = await Cart.findOne({ user: user.userId });
      if (!cart) {
        return NextResponse.json(
          { success: false, message: 'Cart not found' },
          { status: 404 }
        );
      }

      cart.items = cart.items.filter((item: any) => item._id.toString() !== params.itemId);

      return NextResponse.json(await buildCartResponse(cart));
    } catch (error: any) {
      console.error('Remove from cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to remove from cart' },
        { status: 500 }
      );
    }
  })(request);
}

