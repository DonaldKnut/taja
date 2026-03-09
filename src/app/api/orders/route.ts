import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { notifyAdminsNewOrder } from '@/lib/notifications';
import { sendOrderConfirmationEmail } from '@/lib/email';


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

      // ── MANDATORY: Payment Verification for Paystack ──
      // In this version of the app, we only accept Paystack. No order is created without payment.
      const paymentReference = body.paymentReference;

      if (!paymentReference) {
        return NextResponse.json(
          { success: false, message: 'Payment reference is required to complete order' },
          { status: 400 }
        );
      }

      try {
        const { verifyPayment } = await import('@/lib/payments/index');
        const verification = await verifyPayment('paystack', paymentReference);

        if (!verification?.status || verification?.data?.status !== 'success') {
          return NextResponse.json(
            { success: false, message: 'Payment verification failed or was declined' },
            { status: 400 }
          );
        }

        // Verify amount (Paystack amount is in kobo)
        const paidAmount = verification.data.amount / 100;
        const expectedAmount = total;

        // Allow for minor rounding differences (within 1 Naira)
        if (Math.abs(paidAmount - expectedAmount) > 2) { // Slightly wider margin for precision
          return NextResponse.json(
            { success: false, message: `Payment amount mismatch. Paid: ₦${paidAmount}, Expected: ₦${expectedAmount}` },
            { status: 400 }
          );
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        return NextResponse.json(
          { success: false, message: 'Could not verify payment with provider' },
          { status: 500 }
        );
      }

      // ── Payment Verified ── Now we can proceed with side effects

      // 1. Update product stock (only after payment is verified)
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (product && product.inventory.trackQuantity) {
          product.inventory.quantity -= item.quantity;
          if (product.inventory.quantity <= 0) {
            product.status = 'out_of_stock';
          }
          await product.save();
        }
      }

      // 2. Create order
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
        status: 'processing', // Orders are immediately processing after payment
        paymentStatus: 'paid',
        paymentReference,
        paymentMethod: 'paystack',
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

      // ── Fire post-order notifications asynchronously ─────────────────────
      (async () => {
        try {
          const [buyer, shop, seller] = await Promise.all([
            User.findById(order.buyer).select('fullName email').lean(),
            shopId ? Shop.findById(shopId).select('shopName').lean() : null,
            User.findById(order.seller).select('fullName email').lean(),
          ]);

          const buyerDoc = buyer as any;
          const sellerDoc = seller as any;
          const shopDoc = shop as any;

          // 1. Notify admins (in-app)
          await notifyAdminsNewOrder({
            orderId: order._id.toString(),
            orderNumber: order.orderNumber || `#${order._id.toString().slice(-8)}`,
            buyerName: buyerDoc?.fullName || 'Buyer',
            buyerEmail: buyerDoc?.email,
            shopName: shopDoc?.shopName,
            sellerName: sellerDoc?.fullName,
            totalNaira: total,
          });

          // 2. Send buyer order confirmation email
          if (buyerDoc?.email) {
            await sendOrderConfirmationEmail(
              buyerDoc.email,
              buyerDoc.fullName || 'Customer',
              order.orderNumber || order._id.toString().slice(-8),
              orderItems.map(i => ({ name: i.title, quantity: i.quantity, price: i.price, image: i.image || '' })),
              subtotal, shipping, discount, total,
              {
                fullName: resolvedShippingAddress.fullName || '',
                addressLine1: resolvedShippingAddress.addressLine1 || '',
                addressLine2: resolvedShippingAddress.addressLine2,
                city: resolvedShippingAddress.city || '',
                state: resolvedShippingAddress.state || '',
                phone: resolvedShippingAddress.phone || '',
              },
              order._id.toString(),
            ).catch((e: any) => console.error('Buyer confirmation email error:', e));
          }

          // 3. Send seller new-order alert email
          if (sellerDoc?.email) {
            const { Resend } = await import('resend');
            const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
            if (resendClient) {
              const orderUrl = `${process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop'}/seller/orders/${order._id}`;
              const adminOrderUrl = `${process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop'}/admin/orders/${order._id}`;

              // Notify Seller
              await resendClient.emails.send({
                from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                to: sellerDoc.email,
                subject: `🛍️ New Order #${order.orderNumber || order._id.toString().slice(-8)} on Taja.Shop`,
                html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                  <h2 style="color:#111827;">You have a new order!</h2>
                  <p>Hi ${sellerDoc.fullName || 'Seller'}, a new order has been placed on <strong>${shopDoc?.shopName || 'your shop'}</strong>.</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="padding:8px;color:#6b7280;font-size:13px;">Order Number</td><td style="padding:8px;font-weight:600;">${order.orderNumber || order._id.toString().slice(-8)}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;font-size:13px;">Items</td><td style="padding:8px;font-weight:600;">${orderItems.length} item(s)</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;font-size:13px;">Total</td><td style="padding:8px;font-weight:600;color:#059669;">₦${total.toLocaleString()}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;font-size:13px;">Payment</td><td style="padding:8px;font-weight:600;">Held in Escrow — released after delivery</td></tr>
                  </table>
                  <p style="margin:24px 0;text-align:center;"><a href="${orderUrl}" style="background:#111827;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:600;font-size:14px;">View & Process Order</a></p>
                  <p style="color:#9ca3af;font-size:11px;margin-top:24px;">© ${new Date().getFullYear()} Taja.Shop</p>
                </div>`,
              }).catch((e: any) => console.error('Seller new-order email error:', e));

              // Notify Admins via Email
              const admins = await User.find({ role: 'admin' }).select('email fullName').lean();
              for (const admin of admins) {
                if ((admin as any).email) {
                  await resendClient.emails.send({
                    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
                    to: (admin as any).email,
                    subject: `🚨 Admin Alert: New Order #${order.orderNumber || order._id.toString().slice(-8)}`,
                    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #fee2e2;border-radius:16px;">
                      <h2 style="color:#b91c1c;">New Transaction Detected</h2>
                      <p><strong>Order Number:</strong> ${order.orderNumber || order._id.toString().slice(-8)}</p>
                      <p><strong>Buyer:</strong> ${buyerDoc?.fullName || 'N/A'} (${buyerDoc?.email || 'N/A'})</p>
                      <p><strong>Seller/Shop:</strong> ${sellerDoc?.fullName || 'N/A'} / ${shopDoc?.shopName || 'N/A'}</p>
                      <p><strong>Total:</strong> <span style="color:#059669;font-weight:bold;">₦${total.toLocaleString()}</span></p>
                      <p>The payment is currently <strong>Processing/Held in Escrow</strong>.</p>
                      <p style="margin:24px 0;text-align:center;"><a href="${adminOrderUrl}" style="background:#b91c1c;color:#fff;padding:12px 28px;border-radius:99px;text-decoration:none;font-weight:600;font-size:14px;">Audit Order</a></p>
                    </div>`,
                  }).catch((e: any) => console.error('Admin new-order email error:', e));
                }
              }
            }
          }
        } catch (e) {
          console.error('Post-order notification error:', e);
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








