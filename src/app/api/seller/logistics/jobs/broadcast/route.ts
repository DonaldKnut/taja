import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { requireRole } from "@/lib/middleware";
import { createBroadcastDeliveryJobForOrder } from "@/lib/deliveryBroadcastFromOrder";
import { notifyAdminsLogisticsJobBroadcastCreated } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

// POST /api/seller/logistics/jobs/broadcast — seller requests rider dispatch for their order
export async function POST(request: NextRequest) {
  return requireRole(["seller", "admin"])(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const orderId = String(body?.orderId || "").trim();
      if (!orderId) {
        return NextResponse.json({ success: false, message: "orderId is required" }, { status: 400 });
      }

      const order = await Order.findById(orderId).select("seller").lean();
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
      const sellerId = String((order as { seller?: { toString: () => string } }).seller);
      if (user.role !== "admin" && sellerId !== user.userId) {
        return NextResponse.json({ success: false, message: "Not your order" }, { status: 403 });
      }

      const radiusKm = Number(body?.radiusKm || 10);
      const ttlMinutes = Number(body?.ttlMinutes || 20);
      const deliveryFeeKobo = Number(body?.deliveryFeeKobo || 0);

      const result = await createBroadcastDeliveryJobForOrder({
        orderId,
        actorUserId: user.userId,
        actorRole: user.role === "admin" ? "admin" : "seller",
        radiusKm,
        ttlMinutes,
        deliveryFeeKobo,
        pickupAddress: body?.pickupAddress,
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status }
        );
      }

      void notifyAdminsLogisticsJobBroadcastCreated({
        jobId: String(result.job._id),
        orderId: String(result.job.order),
        orderNumber: result.orderNumber,
        pickupCity: result.job.pickup?.city || "Unknown",
        pickupState: result.job.pickup?.state || "Unknown",
      });

      return NextResponse.json({
        success: true,
        message: "Riders nearby can now see this job. Share pickup OTP only with your rider.",
        data: {
          job: result.job,
          otp: {
            pickupCode: result.pickupOtp,
            deliveryCode: result.deliveryOtp,
          },
        },
      });
    } catch (error: any) {
      console.error("POST seller logistics jobs broadcast error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to create delivery job" },
        { status: 500 }
      );
    }
  })(request);
}
