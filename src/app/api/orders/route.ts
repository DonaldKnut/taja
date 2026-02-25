import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { notifyAdminsNewOrder } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// GET /api/orders - Get user orders
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status');
      const role = searchParams.get('role') || 'buyer'; // buyer or seller

      const query: any = {};
      if (role === 'buyer') {
        query.buyer = user.userId;
      } else if (role === 'seller') {
        query.seller = user.userId;
      }

      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('buyer', 'fullName email')
          .populate('seller', 'fullName email')
          .populate('shop', 'shopName shopSlug')
          .populate('items.product')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('Get orders error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { items, shippingAddress, paymentMethod, couponCode } = body;

      if (!items || items.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Order items are required' },
          { status: 400 }
        );
      }

      if (!shippingAddress) {
        return NextResponse.json(
          { success: false, message: 'Shipping address is required' },
          { status: 400 }
        );
      }

      await connectDB();

      // Validate products and calculate totals
      let subtotal = 0;
      let shipping = 0;
      const orderItems: any[] = [];
      let sellerId: string | null = null;
      let shopId: string | null = null;

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || product.status !== 'active') {
          return NextResponse.json(
            { success: false, message: `Product ${item.productId} not available` },
            { status: 400 }
          );
        }

        // Check stock
        if (product.inventory.trackQuantity && product.inventory.quantity < item.quantity) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for ${product.title}` },
            { status: 400 }
          );
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        // Product-level shipping: use shippingCost per unit or free
        const itemShipping = (product.shipping?.freeShipping ? 0 : (product.shipping?.shippingCost || 0)) * item.quantity;
        shipping += itemShipping;

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
          title: product.title,
          image: product.images[0],
        });

        sellerId = product.seller.toString();
        shopId = product.shop?.toString() || null;
        // Update product stock
        if (product.inventory.trackQuantity) {
          product.inventory.quantity -= item.quantity;
          if (product.inventory.quantity <= 0) {
            product.status = 'out_of_stock';
          }
          await product.save();
        }
      }

      // If no product-level shipping, use shop default delivery fee (once per order)
      if (shipping === 0 && shopId) {
        const shop = await Shop.findById(shopId).select('settings').lean();
        const defaultFee = (shop as any)?.settings?.defaultDeliveryFee;
        if (typeof defaultFee === 'number' && defaultFee > 0) {
          shipping = defaultFee;
        }
      }

      const tax = subtotal * 0.075; // 7.5% VAT (Nigeria)
      const discount = 0; // TODO: Apply coupon if provided
      const total = subtotal + shipping + tax - discount;

      // Create order
      const order = await Order.create({
        buyer: user.userId,
        seller: sellerId!,
        shop: shopId,
        items: orderItems,
        shippingAddress,
        totals: {
          subtotal,
          shipping,
          tax,
          discount,
          total,
        },
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'flutterwave',
      });

      // Notify admins so they can follow the process (payment → escrow → delivery → release)
      (async () => {
        try {
          const [buyer, shop, seller] = await Promise.all([
            User.findById(order.buyer).select('fullName email').lean(),
            shopId ? Shop.findById(shopId).select('shopName').lean() : null,
            User.findById(order.seller).select('fullName').lean(),
          ]);
          await notifyAdminsNewOrder({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber || `#${order._id.toString().slice(-8)}`,
            buyerName: (buyer as any)?.fullName || 'Buyer',
            buyerEmail: (buyer as any)?.email,
            shopName: (shop as any)?.shopName,
            sellerName: (seller as any)?.fullName,
            totalNaira: total,
          });
        } catch (e) {
          console.error('Admin new-order notification error:', e);
        }
      })();

      // Clear cart if order was from cart
      if (body.fromCart) {
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
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Order created successfully',
          data: order,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Create order error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create order' },
        { status: 500 }
      );
    }
  })(request);
}








