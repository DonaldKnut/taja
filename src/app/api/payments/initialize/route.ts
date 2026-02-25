import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { connectDB } from "@/lib/db";
import { initializePayment } from "@/lib/payments";
import Order from "@/models/Order";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/payments/initialize
 * Initialize payment for an order
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const { orderId, provider = "auto" } = body;

      if (!orderId) {
        return NextResponse.json(
          { success: false, message: "Order ID is required" },
          { status: 400 }
        );
      }

      // Get order
      const order = await Order.findById(orderId)
        .populate("buyer", "fullName email phone")
        .populate("seller", "fullName email phone");

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      // Verify order belongs to buyer
      if (order.buyer.toString() !== user.userId) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }

      // Check if payment already processed
      if (order.paymentStatus === "paid") {
        return NextResponse.json(
          { success: false, message: "Payment already processed" },
          { status: 400 }
        );
      }

      // Generate unique transaction reference
      const transactionRef = order.orderNumber || `TJA-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Get redirect URL
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "https://tajaapp.shop";
      const redirectUrl = `${baseUrl}/api/payments/verify?reference=${transactionRef}&orderId=${orderId}`;

      // Initialize payment
      const paymentResponse = await initializePayment(provider, {
        amount: order.totals.total,
        email: (order.buyer as any).email || user.email,
        fullname: (order.buyer as any).fullName || "Customer",
        reference: transactionRef,
        redirectUrl,
        phone: (order.buyer as any).phone,
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          buyerId: user.userId,
        },
      });

      // Update order with payment reference
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentReference: transactionRef,
        },
      });

      const paymentUrl =
        (paymentResponse.data as any)?.link ||
        (paymentResponse.data as any)?.authorization_url;

      return NextResponse.json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          paymentUrl,
          reference: transactionRef,
          orderId: order._id,
        },
      });
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to initialize payment",
        },
        { status: 500 }
      );
    }
  })(request);
}





