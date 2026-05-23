import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import DeliveryJob from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";
import { canTransitionDeliveryJob } from "@/lib/jobs/deliveryJobs";
import Order from "@/models/Order";
import { notifyAdminsLogisticsJobOtpVerified } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

// POST /api/logistics/jobs/:id/otp/verify - verify pickup or delivery OTP
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const stage = String(body?.stage || "");
      const code = String(body?.code || "").trim();
      if (!["pickup", "delivery"].includes(stage) || !/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { success: false, message: "Valid stage and 6-digit OTP are required" },
          { status: 400 }
        );
      }

      const job = await DeliveryJob.findById(params.id).select("+otp.pickupCodeHash +otp.deliveryCodeHash");
      if (!job) {
        return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
      }
      if (!job.rider || String(job.rider) !== user.userId) {
        return NextResponse.json({ success: false, message: "Only assigned rider can verify OTP" }, { status: 403 });
      }

      if (stage === "pickup") {
        if (!canTransitionDeliveryJob(job.status, "picked_up")) {
          return NextResponse.json(
            { success: false, message: "Pickup OTP can only be verified in reserved state" },
            { status: 400 }
          );
        }
        if (job.otp.pickupCodeHash !== hashCode(code)) {
          return NextResponse.json({ success: false, message: "Invalid pickup OTP" }, { status: 400 });
        }
        job.status = "picked_up";
        job.otp.pickupVerifiedAt = new Date();
      } else {
        if (!canTransitionDeliveryJob(job.status, "delivered")) {
          return NextResponse.json(
            { success: false, message: "Delivery OTP can only be verified after pickup" },
            { status: 400 }
          );
        }
        if (!job.otp.pickupVerifiedAt) {
          return NextResponse.json(
            { success: false, message: "Pickup OTP must be verified first" },
            { status: 400 }
          );
        }
        if (job.otp.deliveryCodeHash !== hashCode(code)) {
          return NextResponse.json({ success: false, message: "Invalid delivery OTP" }, { status: 400 });
        }
        job.status = "delivered";
        job.otp.deliveryVerifiedAt = new Date();
      }

      await job.save();
      await DeliveryEvent.create({
        job: job._id,
        actorUserId: user.userId,
        actorRole: "logistics",
        eventType: stage === "pickup" ? "pickup_otp_verified" : "delivery_otp_verified",
        metadata: { status: job.status },
      });

      const orderId = job.order ? String(job.order) : "";
      let orderNumber: string | undefined;
      if (orderId) {
        const o = await Order.findById(orderId).select("orderNumber").lean();
        orderNumber = (o as { orderNumber?: string } | null)?.orderNumber;
      }
      void notifyAdminsLogisticsJobOtpVerified({
        jobId: String(job._id),
        orderId,
        orderNumber,
        stage: stage as "pickup" | "delivery",
        newStatus: job.status,
      });

      return NextResponse.json({ success: true, message: `${stage} OTP verified`, data: job });
    } catch (error: any) {
      console.error("POST logistics jobs otp verify error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed OTP verification" },
        { status: 500 }
      );
    }
  })(request);
}
