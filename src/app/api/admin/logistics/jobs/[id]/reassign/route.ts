import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import DeliveryJob from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";
import { canTransitionDeliveryJob } from "@/lib/jobs/deliveryJobs";
import { notifyAdminsLogisticsJobReleasedToQueue } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

// POST /api/admin/logistics/jobs/:id/reassign - release claimed job back to queue
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireRole(["admin"])(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json().catch(() => ({}));
      const ttlMinutes = Math.max(5, Number(body?.ttlMinutes || 20));
      const existing = await DeliveryJob.findById(params.id).lean();
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Job not found" },
          { status: 404 }
        );
      }
      if (!canTransitionDeliveryJob(existing.status, "open")) {
        return NextResponse.json(
          { success: false, message: "This job state cannot be reassigned to open" },
          { status: 400 }
        );
      }
      const updated = await DeliveryJob.findOneAndUpdate(
        { _id: params.id, status: existing.status },
        {
          $set: {
            status: "open",
            rider: undefined,
            "claim.claimedAt": undefined,
            "claim.claimExpiresAt": undefined,
            "broadcast.expiresAt": new Date(Date.now() + ttlMinutes * 60 * 1000),
          },
        },
        { new: true }
      ).lean();

      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Active job not found for reassignment" },
          { status: 404 }
        );
      }
      await DeliveryEvent.create({
        job: updated._id,
        actorUserId: user.userId,
        actorRole: "admin",
        eventType: "job_reassigned",
        metadata: { ttlMinutes },
      });
      void notifyAdminsLogisticsJobReleasedToQueue({
        jobId: String(updated._id),
        ttlMinutes,
      });
      return NextResponse.json({ success: true, message: "Job released back to queue", data: updated });
    } catch (error: any) {
      console.error("POST admin logistics jobs reassign error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to reassign job" },
        { status: 500 }
      );
    }
  })(request);
}
