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

// POST /api/cart/merge - Merge cart items
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { items } = body;

      if (!items || !Array.isArray(items)) {
        return NextResponse.json(
          { success: false, message: 'Items array is required' },
          { status: 400 }
        );
      }

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

      // Merge items
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product || product.status !== 'active') {
          continue; // Skip invalid products
        }
        const quantity = Number(item.quantity || 1);
        if (!Number.isInteger(quantity) || quantity < 1) continue;
        const variant = resolveVariant(product, item.variantId);
        if (item.variantId && !variant) continue;
        if (variant && variant.active === false) continue;
        const availableStock = getAvailableStock(product, variant);
        if (availableStock < 1) continue;
        const moq = product.inventory?.moq ?? 1;
        const finalAddQty = Math.max(quantity, moq);

        const existingItem = cart.items.find(
          (cartItem: any) =>
            cartItem.product.toString() === String(item.product) &&
            String(cartItem.variantId || '') === String(item.variantId || '')
        );

        if (existingItem) {
          existingItem.quantity = Math.min(existingItem.quantity + finalAddQty, availableStock);
        } else {
          cart.items.push({
            product: item.product,
            quantity: Math.min(finalAddQty, availableStock),
            variantId: item.variantId || undefined,
            variantName: item.variantName || variant?.name || undefined,
            addedAt: new Date(),
          });
        }
      }

      return NextResponse.json(await buildCartResponse(cart));
    } catch (error: any) {
      console.error('Merge cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to merge cart' },
        { status: 500 }
      );
    }
  })(request);
}








