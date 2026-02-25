import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/cart - Get user cart
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      let cart = await Cart.findOne({ user: user.userId }).populate('items.product');

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

      // Calculate totals
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
        data: cart,
      });
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
      const { productId, quantity = 1 } = body;

      if (!productId) {
        return NextResponse.json(
          { success: false, message: 'Product ID is required' },
          { status: 400 }
        );
      }

      await connectDB();

      // Verify product exists and is available
      const product = await Product.findById(productId);
      if (!product || product.status !== 'active') {
        return NextResponse.json(
          { success: false, message: 'Product not available' },
          { status: 404 }
        );
      }

      // Check stock
      if (product.inventory.trackQuantity && product.inventory.quantity < quantity) {
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
        (item: any) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          addedAt: new Date(),
        });
      }

      // Recalculate totals
      let subtotal = 0;
      for (const item of cart.items) {
        const prod = await Product.findById(item.product);
        if (prod) {
          subtotal += prod.price * item.quantity;
        }
      }

      cart.totals.subtotal = subtotal;
      cart.totals.total = subtotal + cart.totals.shipping + cart.totals.tax - cart.totals.discount;
      await cart.save();

      return NextResponse.json({
        success: true,
        message: 'Item added to cart',
        data: cart,
      });
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
        message: 'Cart cleared',
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








