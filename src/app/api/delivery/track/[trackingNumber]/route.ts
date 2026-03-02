import { NextRequest, NextResponse } from "next/server";
import { trackDelivery, DeliveryProvider } from "@/lib/delivery";
import Order from "@/models/Order";
import connectDB from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    trackingNumber: string;
  };
}

/**
 * GET /api/delivery/track/[trackingNumber]
 * Get real-time tracking information for a delivery
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { trackingNumber } = params;
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as DeliveryProvider | null;

    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, message: "Tracking number is required" },
        { status: 400 }
      );
    }

    // If provider not specified, look it up from the order
    let deliveryProvider = provider;
    if (!deliveryProvider) {
      await connectDB();
      const order = await Order.findOne({ "delivery.trackingNumber": trackingNumber })
        .select("delivery.provider")
        .lean();
      
      if (order?.delivery?.provider) {
        deliveryProvider = order.delivery.provider as DeliveryProvider;
      } else {
        return NextResponse.json(
          { success: false, message: "Provider not found for this tracking number" },
          { status: 400 }
        );
      }
    }

    // Get tracking information
    const tracking = await trackDelivery(trackingNumber, deliveryProvider);

    return NextResponse.json({
      success: true,
      data: tracking,
    });
  } catch (error: any) {
    console.error("Track delivery error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to track delivery" },
      { status: 500 }
    );
  }
}
