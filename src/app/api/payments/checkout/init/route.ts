import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { initializePayment } from "@/lib/payments";
import Product from "@/models/Product";
import Shop from "@/models/Shop";
import User from "@/models/User";
import Order from "@/models/Order";
import { v4 as uuidv4 } from "uuid";
import { calculateVatAmount } from "@/lib/tax";

export const dynamic = "force-dynamic";

function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ success: false, code, message }, { status });
}

/**
 * POST /api/payments/checkout/init
 * Initialize checkout payment from cart/order intent (mobile-friendly).
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const {
        items,
        shippingAddress,
        couponCode,
        deliverySlotId,
        returnUrl,
        provider = "paystack",
      } = body || {};

      if (!Array.isArray(items) || items.length === 0) {
        return errorResponse("Order items are required", "CHECKOUT_ITEMS_REQUIRED", 400);
      }

      if (!shippingAddress) {
        return errorResponse("Shipping address is required", "ADDRESS_INVALID", 400);
      }

      await connectDB();

      let resolvedShippingAddress: any = shippingAddress;
      if (typeof shippingAddress === "string") {
        const userDoc: any = await User.findById(user.userId).select("addresses").lean();
        const addr = (userDoc?.addresses || []).find(
          (a: any) => String(a._id) === String(shippingAddress)
        );
        if (!addr) {
          return errorResponse("Shipping address not found", "ADDRESS_INVALID", 400);
        }
        resolvedShippingAddress = {
          fullName: addr.fullName,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country || "Nigeria",
        };
      }

      let subtotal = 0;
      let shipping = 0;
      let totalWeightKg = 0;
      let shopId: string | null = null;

      for (const item of items) {
        const product = await Product.findById(item.productId).select(
          "status price shipping seller shop inventory title"
        );
        if (!product || product.status !== "active") {
          return errorResponse(
            `Product ${item.productId} not available`,
            "CHECKOUT_ITEM_UNAVAILABLE",
            400
          );
        }

        if (product.inventory?.trackQuantity && product.inventory.quantity < item.quantity) {
          return errorResponse(`Insufficient stock for ${product.title}`, "CHECKOUT_OUT_OF_STOCK", 400);
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        const itemShipping =
          (product.shipping?.freeShipping ? 0 : product.shipping?.shippingCost || 0) * item.quantity;
        shipping += itemShipping;

        totalWeightKg += (product.shipping?.weight || 0) * item.quantity;
        shopId = product.shop?.toString() || shopId;
      }

      if (shipping === 0 && shopId) {
        const shop = await Shop.findById(shopId).select("settings").lean();
        const settings = (shop as any)?.settings || {};

        if (
          typeof settings.globalMinOrderAmount === "number" &&
          settings.globalMinOrderAmount > 0 &&
          subtotal < settings.globalMinOrderAmount
        ) {
          return errorResponse(
            "Order does not meet this shop's minimum order amount for delivery.",
            "CHECKOUT_MIN_ORDER_NOT_MET",
            400
          );
        }

        const deliveryEnabled =
          typeof settings.globalDeliveryEnabled === "boolean" ? settings.globalDeliveryEnabled : true;

        if (deliveryEnabled) {
          const tiers = Array.isArray(settings.deliveryFeeTiers) ? settings.deliveryFeeTiers : [];
          if (tiers.length > 0 && totalWeightKg > 0) {
            const matchedTier = tiers.find((tier: any) => {
              const min = typeof tier.minWeightKg === "number" ? tier.minWeightKg : 0;
              const max = typeof tier.maxWeightKg === "number" ? tier.maxWeightKg : 0;
              if (max > 0) return totalWeightKg >= min && totalWeightKg <= max;
              return totalWeightKg >= min;
            });
            if (matchedTier && typeof matchedTier.priceNaira === "number" && matchedTier.priceNaira >= 0) {
              shipping = matchedTier.priceNaira;
            }
          }

          if (shipping === 0) {
            const defaultFee = settings.defaultDeliveryFee;
            if (typeof defaultFee === "number" && defaultFee > 0) shipping = defaultFee;
          }
        }
      }

      if (deliverySlotId && shopId) {
        const shop: any = await Shop.findById(shopId).select("settings.deliverySlots").lean();
        const slots = Array.isArray(shop?.settings?.deliverySlots) ? shop.settings.deliverySlots : [];
        const selectedSlot = slots.find(
          (s: any) => String(s.id) === String(deliverySlotId) && s.active !== false
        );

        if (!selectedSlot) {
          return errorResponse(
            "Selected delivery slot is not available",
            "DELIVERY_SLOT_UNAVAILABLE",
            400
          );
        }

        const slotDate = selectedSlot.date ? new Date(selectedSlot.date) : null;
        if (!slotDate || Number.isNaN(slotDate.getTime())) {
          return errorResponse("Selected delivery slot is invalid", "DELIVERY_SLOT_UNAVAILABLE", 400);
        }

        const now = new Date();
        if (slotDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          return errorResponse("Selected delivery slot is in the past", "DELIVERY_SLOT_UNAVAILABLE", 400);
        }

        const maxOrders = Number(selectedSlot.maxOrders || 0);
        if (!Number.isFinite(maxOrders) || maxOrders <= 0) {
          return errorResponse("Selected delivery slot has invalid capacity", "DELIVERY_SLOT_UNAVAILABLE", 400);
        }

        const booked = await Order.countDocuments({
          shop: shopId,
          status: { $nin: ["cancelled", "refunded"] },
          "delivery.slotId": String(deliverySlotId),
        });

        if (booked >= maxOrders) {
          return errorResponse(
            "This delivery slot is fully booked. Please choose another slot.",
            "DELIVERY_SLOT_UNAVAILABLE",
            400
          );
        }
      }

      const shopForTax = shopId ? await Shop.findById(shopId).select("taxProfile").lean() : null;
      const tax = calculateVatAmount(subtotal, shopForTax as any).tax;
      const discount = 0; // TODO: couponCode implementation
      const totalNaira = subtotal + shipping + tax - discount;
      const totalKobo = Math.round(totalNaira * 100);

      const reference = `CHK-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://tajaapp.shop";
      const redirectUrl =
        typeof returnUrl === "string" && returnUrl.trim().length > 0
          ? returnUrl
          : `${baseUrl}/checkout?reference=${encodeURIComponent(reference)}&status=success`;

      const buyer = await User.findById(user.userId).select("email fullName phone").lean();
      if (!buyer?.email) {
        return errorResponse("User email is required", "CHECKOUT_USER_INVALID", 400);
      }

      const paymentResponse = await initializePayment(provider, {
        amount: totalNaira,
        email: (buyer as any).email,
        fullname: (buyer as any).fullName || "Customer",
        reference,
        redirectUrl,
        phone: (buyer as any).phone,
        metadata: {
          userId: user.userId,
          channel: body?.channel || "mobile",
          expectedAmountKobo: totalKobo,
          currency: "NGN",
          couponCode: couponCode || null,
          deliverySlotId: deliverySlotId || null,
        },
      });

      const checkoutUrl =
        (paymentResponse?.data as any)?.link || (paymentResponse?.data as any)?.authorization_url;

      if (!checkoutUrl) {
        return errorResponse(
          "Could not initialize checkout URL with provider",
          "PAYMENT_INIT_FAILED",
          500
        );
      }

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      return NextResponse.json({
        success: true,
        data: {
          provider: provider || "paystack",
          checkoutUrl,
          reference,
          amount: totalKobo,
          currency: "NGN",
          expiresAt,
        },
      });
    } catch (error: any) {
      console.error("Checkout init error:", error);
      return errorResponse(error?.message || "Failed to initialize checkout", "PAYMENT_INIT_FAILED", 500);
    }
  })(request);
}

