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
      const { items, shippingAddress, paymentMethod, couponCode, deliverySlotId } = body;

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

      // Resolve shipping address if client passed an address ID
      let resolvedShippingAddress: any = shippingAddress;
      if (typeof shippingAddress === 'string') {
        const userDoc: any = await User.findById(user.userId).select('addresses').lean();
        const addr = (userDoc?.addresses || []).find((a: any) => String(a._id) === String(shippingAddress));
        if (!addr) {
          return NextResponse.json(
            { success: false, message: 'Shipping address not found' },
            { status: 400 }
          );
        }
        // Normalize to the Order.shippingAddress shape
        resolvedShippingAddress = {
          fullName: addr.fullName,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country || 'Nigeria',
        };
      }

      // Validate products and calculate totals
      let subtotal = 0;
      let shipping = 0;
      // Sum of product.shipping.weight * quantity (in kg) for this order
      let totalWeightKg = 0;
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
        const itemShipping =
          (product.shipping?.freeShipping ? 0 : product.shipping?.shippingCost || 0) * item.quantity;
        shipping += itemShipping;
        // Track total order weight in kg for shop-level delivery fee tiers
        const itemWeightKg = (product.shipping?.weight || 0) * item.quantity;
        totalWeightKg += itemWeightKg;

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

      // If no product-level shipping, use shop delivery configuration (once per order)
      if (shipping === 0 && shopId) {
        const shop = await Shop.findById(shopId).select('settings').lean();
        const settings = (shop as any)?.settings || {};

        // Enforce global delivery minimum order amount (shop-level MOQ) if configured
        if (typeof settings.globalMinOrderAmount === 'number' && settings.globalMinOrderAmount > 0) {
          if (subtotal < settings.globalMinOrderAmount) {
            return NextResponse.json(
              {
                success: false,
                message: 'Order does not meet this shop\'s minimum order amount for delivery.',
              },
              { status: 400 }
            );
          }
        }

        // If delivery is globally disabled for this shop, keep shipping at 0 (pickup / external logistics)
        const deliveryEnabled =
          typeof settings.globalDeliveryEnabled === 'boolean' ? settings.globalDeliveryEnabled : true;

        if (deliveryEnabled) {
          const tiers = Array.isArray(settings.deliveryFeeTiers) ? settings.deliveryFeeTiers : [];

          if (tiers.length > 0 && totalWeightKg > 0) {
            // Find the first tier whose weight range contains the total order weight
            const matchedTier = tiers.find((tier: any) => {
              const min = typeof tier.minWeightKg === 'number' ? tier.minWeightKg : 0;
              const max = typeof tier.maxWeightKg === 'number' ? tier.maxWeightKg : 0;
              if (max > 0) {
                return totalWeightKg >= min && totalWeightKg <= max;
              }
              // If max is 0 or not set, treat as open-ended tier
              return totalWeightKg >= min;
            });

            if (matchedTier && typeof matchedTier.priceNaira === 'number' && matchedTier.priceNaira >= 0) {
              shipping = matchedTier.priceNaira;
            }
          }

          // Fallback to default flat delivery fee if no tier matched or no weight info
          if (shipping === 0) {
            const defaultFee = settings.defaultDeliveryFee;
            if (typeof defaultFee === 'number' && defaultFee > 0) {
              shipping = defaultFee;
            }
          }
        }
      }

      // Validate and attach selected delivery slot (optional)
      let selectedSlot: any = null;
      if (deliverySlotId && shopId) {
        const shop: any = await Shop.findById(shopId).select('settings.deliverySlots').lean();
        const slots = Array.isArray(shop?.settings?.deliverySlots) ? shop.settings.deliverySlots : [];
        selectedSlot = slots.find((s: any) => String(s.id) === String(deliverySlotId) && s.active !== false);

        if (!selectedSlot) {
          return NextResponse.json(
            { success: false, message: 'Selected delivery slot is not available' },
            { status: 400 }
          );
        }

        const slotDate = selectedSlot.date ? new Date(selectedSlot.date) : null;
        if (!slotDate || Number.isNaN(slotDate.getTime())) {
          return NextResponse.json(
            { success: false, message: 'Selected delivery slot is invalid' },
            { status: 400 }
          );
        }

        const now = new Date();
        // Basic guard: don’t allow past-dated slots
        if (slotDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          return NextResponse.json(
            { success: false, message: 'Selected delivery slot is in the past' },
            { status: 400 }
          );
        }

        const maxOrders = Number(selectedSlot.maxOrders || 0);
        if (!Number.isFinite(maxOrders) || maxOrders <= 0) {
          return NextResponse.json(
            { success: false, message: 'Selected delivery slot has invalid capacity' },
            { status: 400 }
          );
        }

        const booked = await Order.countDocuments({
          shop: shopId,
          status: { $nin: ['cancelled', 'refunded'] },
          'delivery.slotId': String(deliverySlotId),
        });

        if (booked >= maxOrders) {
          return NextResponse.json(
            { success: false, message: 'This delivery slot is fully booked. Please choose another slot.' },
            { status: 400 }
          );
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
        shippingAddress: resolvedShippingAddress,
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
        delivery: selectedSlot
          ? {
              slotId: String(selectedSlot.id),
              slotDate: new Date(selectedSlot.date),
              slotStartTime: String(selectedSlot.startTime || ''),
              slotEndTime: selectedSlot.endTime ? String(selectedSlot.endTime) : undefined,
              slotMaxOrders: Number(selectedSlot.maxOrders || 0),
            }
          : undefined,
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








