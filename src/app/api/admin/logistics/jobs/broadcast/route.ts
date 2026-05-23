import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import { createBroadcastDeliveryJobForOrder } from "@/lib/deliveryBroadcastFromOrder";
import { notifyAdminsLogisticsJobBroadcastCreated } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

// POST /api/admin/logistics/jobs/broadcast - create nearby first-to-accept job
export async function POST(request: NextRequest) {
  return requireRole(["admin"])(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const orderId = String(body?.orderId || "").trim();
      const radiusKm = Number(body?.radiusKm || 10);
      const ttlMinutes = Number(body?.ttlMinutes || 20);
      const deliveryFeeKobo = Number(body?.deliveryFeeKobo || 0);

      const result = await createBroadcastDeliveryJobForOrder({
        orderId,
        actorUserId: user.userId,
        actorRole: "admin",
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
        message: "Delivery job broadcast created",
        data: {
          job: result.job,
          otp: {
            pickupCode: result.pickupOtp,
            deliveryCode: result.deliveryOtp,
          },
        },
      });
    } catch (error: any) {
      console.error("POST admin logistics jobs broadcast error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to create delivery job" },
        { status: 500 }
      );
    }
  })(request);
}
