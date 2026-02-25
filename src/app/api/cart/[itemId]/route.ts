import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// PUT /api/cart/:itemId - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { quantity } = body;

      if (!quantity || quantity < 1) {
        return NextResponse.json(
          { success: false, message: 'Quantity must be at least 1' },
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
      if (product && product.inventory.trackQuantity && product.inventory.quantity < quantity) {
        return NextResponse.json(
          { success: false, message: 'Insufficient stock' },
          { status: 400 }
        );
      }

      item.quantity = quantity;

      // Recalculate totals
      let subtotal = 0;
      for (const cartItem of cart.items) {
        const prod = await Product.findById(cartItem.product);
        if (prod) {
          subtotal += prod.price * cartItem.quantity;
        }
      }

      cart.totals.subtotal = subtotal;
      cart.totals.total = subtotal + cart.totals.shipping + cart.totals.tax - cart.totals.discount;
      await cart.save();

      return NextResponse.json({
        success: true,
        message: 'Cart item updated',
        data: cart,
      });
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
        message: 'Item removed from cart',
        data: cart,
      });
    } catch (error: any) {
      console.error('Remove from cart error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to remove from cart' },
        { status: 500 }
      );
    }
  })(request);
}

