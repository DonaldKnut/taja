import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

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

        const existingItem = cart.items.find(
          (cartItem: any) => cartItem.product.toString() === item.product
        );

        if (existingItem) {
          existingItem.quantity += item.quantity || 1;
        } else {
          cart.items.push({
            product: item.product,
            quantity: item.quantity || 1,
            addedAt: new Date(),
          });
        }
      }

      // Recalculate totals
      let subtotal = 0;
      for (const item of cart.items) {
        const product = await Product.findById(item.product);
        if (product) {
          subtotal += product.price * item.quantity;
        }
      }

      cart.totals.subtotal = subtotal;
      cart.totals.total = subtotal + cart.totals.shipping + cart.totals.tax - cart.totals.discount;
      await cart.save();

      return NextResponse.json({
        success: true,
        message: 'Cart merged successfully',
        data: cart,
      });
    } catch (error: any) {
      console.error('Merge cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to merge cart' },
        { status: 500 }
      );
    }
  })(request);
}








