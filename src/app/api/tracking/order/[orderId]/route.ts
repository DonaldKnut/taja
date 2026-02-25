import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { requireAuth } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// GET /api/tracking/order/:orderId - Get tracking info by order ID
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const order = await Order.findById(params.orderId).lean();

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      const isBuyer = order.buyer.toString() === user.userId;
      const isSeller = order.seller.toString() === user.userId;
      const isAdmin = user.role === "admin";

      if (!isBuyer && !isSeller && !isAdmin) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }

      const createdAt = new Date(order.createdAt);
      const now = new Date();

      const steps = [
        {
          code: "pending",
          label: "Order Placed",
          description: "The order has been placed by the buyer.",
          timestamp: createdAt,
        },
        {
          code: "confirmed",
          label: "Order Confirmed",
          description: "The seller has confirmed the order.",
          timestamp: new Date(createdAt.getTime() + 60 * 60 * 1000),
        },
        {
          code: "processing",
          label: "Preparing Package",
          description: "Items are being prepared for shipment.",
          timestamp: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000),
        },
        {
          code: "shipped",
          label: "In Transit",
          description: "The package has been handed over to the logistics partner.",
          timestamp: order.delivery?.estimatedDelivery
            ? new Date(
                (createdAt.getTime() + order.delivery.estimatedDelivery.getTime()) / 2
              )
            : new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
        {
          code: "delivered",
          label: "Delivered",
          description: "The package has been delivered to the customer.",
          timestamp: order.delivery?.deliveredAt || now,
        },
      ];

      const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
      const currentIndex = Math.max(
        0,
        statusOrder.indexOf(order.status as string) ?? 0
      );

      const history = steps
        .slice(0, currentIndex + 1)
        .map((step, index) => ({
          status: step.code,
          label: step.label,
          description: step.description,
          timestamp: step.timestamp,
          completed: index <= currentIndex,
        }));

      return NextResponse.json({
        success: true,
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          isCashOnDelivery: order.paymentMethod === "cod",
          shippingAddress: order.shippingAddress,
          delivery: order.delivery,
          history,
        },
      });
    } catch (error: any) {
      console.error("Get tracking by orderId error:", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to fetch tracking information",
        },
        { status: 500 }
      );
    }
  })(request);
}








