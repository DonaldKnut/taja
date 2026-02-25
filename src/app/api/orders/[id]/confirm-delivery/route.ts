import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// Points: 1 point per ₦100 spent (order total), minimum 1 point
const POINTS_PER_100_NAIRA = 1;
const MIN_POINTS_PER_ORDER = 1;

// POST /api/orders/:id/confirm-delivery - Buyer confirms delivery (escrow release gate)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const order = await Order.findById(params.id);
      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      const isBuyer = order.buyer.toString() === user.userId;
      const isAdmin = user.role === "admin";
      if (!isBuyer && !isAdmin) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }

      if (order.paymentStatus !== "paid" || order.escrowStatus !== "funded") {
        return NextResponse.json(
          { success: false, message: "Order is not in escrow-funded status" },
          { status: 400 }
        );
      }

      // Confirm delivery
      order.status = "delivered";
      order.delivery = order.delivery || ({} as any);
      if (!order.delivery.deliveredAt) {
        order.delivery.deliveredAt = new Date();
      }
      order.delivery.confirmedAt = new Date();

      await order.save();

      // Award buyer points (1 point per ₦100 spent, min 1)
      const orderTotal = order.totals?.total ?? 0;
      const pointsEarned = Math.max(
        MIN_POINTS_PER_ORDER,
        Math.floor(orderTotal / 100) * POINTS_PER_100_NAIRA
      );
      if (pointsEarned > 0) {
        await User.findByIdAndUpdate(order.buyer, {
          $inc: { points: pointsEarned },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Delivery confirmed",
        data: { ...order.toObject(), pointsEarned },
      });
    } catch (error: any) {
      console.error("Confirm delivery error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to confirm delivery" },
        { status: 500 }
      );
    }
  })(request);
}

