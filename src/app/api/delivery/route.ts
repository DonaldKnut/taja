import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import {
  createDeliveryOrder,
  compareDeliveryPrices,
  getServiceableCities,
  DeliveryOrderRequest,
} from "@/lib/delivery";
import Order from "@/models/Order";
import Shop from "@/models/Shop";
import User from "@/models/User";
import { notifyDeliveryUpdate } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/delivery
 * Create a new delivery order
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      const body = await request.json();

      const {
        orderId,
        provider,
        deliveryType,
        scheduledTime,
        notes,
      } = body;

      if (!orderId) {
        return NextResponse.json(
          { success: false, message: "Order ID is required" },
          { status: 400 }
        );
      }

      // Get order details
      const order = await Order.findById(orderId)
        .populate("buyer", "fullName email phone")
        .populate("seller", "fullName email phone")
        .populate("shop", "shopName address")
        .populate("items.product", "title weight dimensions shipping");

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      // Verify the user is the seller
      if (order.seller._id.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: "Only the seller can create delivery" },
          { status: 403 }
        );
      }

      // Get shop details for pickup address
      const shop = await Shop.findById(order.shop);
      if (!shop || !shop.address) {
        return NextResponse.json(
          { success: false, message: "Shop address not found" },
          { status: 400 }
        );
      }

      // Get seller details
      const seller = await User.findById(order.seller._id).select("fullName email phone");

      // Calculate total package weight
      const totalWeight = order.items.reduce((sum: number, item: any) => {
        const productWeight = item.product?.shipping?.weight || 0.5; // default 0.5kg
        return sum + productWeight * item.quantity;
      }, 0);

      // Calculate package dimensions
      const dimensions = calculatePackageDimensions(order.items);

      // Default coordinates (Lagos)
      const defaultLat = 6.5244;
      const defaultLng = 3.3792;

      // Create delivery order request
      const deliveryRequest: DeliveryOrderRequest = {
        pickup: {
          address: `${shop.address.addressLine1}, ${shop.address.city}, ${shop.address.state}`,
          latitude: defaultLat,
          longitude: defaultLng,
          city: shop.address.city,
          state: shop.address.state,
          name: shop.shopName,
          phone: seller?.phone || "",
          email: seller?.email || "",
        },
        dropoff: {
          address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
          latitude: defaultLat,
          longitude: defaultLng,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          name: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
        },
        package: {
          weight: totalWeight,
          dimensions,
          description: `Order ${order.orderNumber} - ${order.items.length} items`,
          value: order.totals.total,
        },
        provider: provider || "auto",
        deliveryType: deliveryType || "same_day",
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        paymentMethod: "prepaid", // Platform pays, buyer already paid
        customerReference: order.orderNumber,
        notes: notes || `Order from ${shop.shopName}`,
      };

      // Create the delivery order
      const delivery = await createDeliveryOrder(deliveryRequest);

      // Update order with delivery information
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          "delivery.provider": delivery.provider,
          "delivery.trackingNumber": delivery.trackingNumber,
          "delivery.estimatedDelivery": delivery.estimatedDeliveryTime,
          status: "processing",
        },
      });

      // Notify buyer
      await notifyDeliveryUpdate(
        order.buyer._id.toString(),
        order.orderNumber,
        "processing",
        delivery.trackingNumber,
        orderId
      );

      return NextResponse.json({
        success: true,
        message: "Delivery order created successfully",
        data: {
          deliveryId: delivery.id,
          trackingNumber: delivery.trackingNumber,
          provider: delivery.provider,
          status: delivery.status,
          estimatedDelivery: delivery.estimatedDeliveryTime,
          price: delivery.price,
          driver: delivery.driver,
        },
      });
    } catch (error: any) {
      console.error("Create delivery error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to create delivery" },
        { status: 500 }
      );
    }
  })(request);
}

/**
 * GET /api/delivery/prices
 * Compare delivery prices across providers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if comparing prices or getting cities
    const action = searchParams.get("action");

    if (action === "cities") {
      const cities = await getServiceableCities();
      return NextResponse.json({
        success: true,
        data: cities,
      });
    }

    // Price comparison
    const pickupLat = parseFloat(searchParams.get("pickupLat") || "0");
    const pickupLng = parseFloat(searchParams.get("pickupLng") || "0");
    const pickupCity = searchParams.get("pickupCity") || "";
    const dropoffLat = parseFloat(searchParams.get("dropoffLat") || "0");
    const dropoffLng = parseFloat(searchParams.get("dropoffLng") || "0");
    const dropoffCity = searchParams.get("dropoffCity") || "";
    const weight = parseFloat(searchParams.get("weight") || "1");

    if (!pickupCity || !dropoffCity) {
      return NextResponse.json(
        { success: false, message: "Pickup and dropoff cities are required" },
        { status: 400 }
      );
    }

    const comparisons = await compareDeliveryPrices(
      {
        latitude: pickupLat,
        longitude: pickupLng,
        city: pickupCity,
      },
      {
        latitude: dropoffLat,
        longitude: dropoffLng,
        city: dropoffCity,
      },
      {
        weight,
      }
    );

    return NextResponse.json({
      success: true,
      data: comparisons,
    });
  } catch (error: any) {
    console.error("Delivery price comparison error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to compare prices" },
      { status: 500 }
    );
  }
}

/**
 * Helper: Calculate package dimensions from order items
 */
function calculatePackageDimensions(items: any[]): {
  length: number;
  width: number;
  height: number;
} | undefined {
  if (!items.length) return undefined;

  // Sum up dimensions or use defaults
  let totalVolume = 0;
  for (const item of items) {
    const dims = item.product?.shipping?.dimensions;
    if (dims) {
      totalVolume += dims.length * dims.width * dims.height * item.quantity;
    }
  }

  if (totalVolume === 0) return undefined;

  // Approximate as a cube for simplicity
  const sideLength = Math.cbrt(totalVolume);
  return {
    length: Math.ceil(sideLength),
    width: Math.ceil(sideLength),
    height: Math.ceil(sideLength),
  };
}
