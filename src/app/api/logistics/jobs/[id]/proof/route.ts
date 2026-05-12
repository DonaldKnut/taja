import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import DeliveryJob from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";
import { notifyAdminsLogisticsJobProofUploaded } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

// POST /api/logistics/jobs/:id/proof - upload pickup or delivery proof URL
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const stage = String(body?.stage || "");
      const photoUrl = String(body?.photoUrl || "").trim();
      if (!["pickup", "delivery"].includes(stage) || !photoUrl) {
        return NextResponse.json(
          { success: false, message: "stage and photoUrl are required" },
          { status: 400 }
        );
      }
      if (photoUrl.length > 500) {
        return NextResponse.json(
          { success: false, message: "photoUrl too long" },
          { status: 400 }
        );
      }

      const job = await DeliveryJob.findById(params.id);
      if (!job) {
        return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
      }
      if (!job.rider || String(job.rider) !== user.userId) {
        return NextResponse.json(
          { success: false, message: "Only assigned rider can upload proof" },
          { status: 403 }
        );
      }

      if (stage === "pickup") {
        if (!job.proof?.pickupPhotos) job.proof.pickupPhotos = [];
        job.proof.pickupPhotos.push(photoUrl);
      } else {
        if (!job.proof?.deliveryPhotos) job.proof.deliveryPhotos = [];
        job.proof.deliveryPhotos.push(photoUrl);
      }
      await job.save();
      await DeliveryEvent.create({
        job: job._id,
        actorUserId: user.userId,
        actorRole: "logistics",
        eventType: stage === "pickup" ? "pickup_proof_uploaded" : "delivery_proof_uploaded",
        metadata: {
          proofCount:
            stage === "pickup"
              ? job.proof?.pickupPhotos?.length || 0
              : job.proof?.deliveryPhotos?.length || 0,
        },
      });

      const proofCount =
        stage === "pickup" ? job.proof?.pickupPhotos?.length || 0 : job.proof?.deliveryPhotos?.length || 0;
      void notifyAdminsLogisticsJobProofUploaded({
        jobId: String(job._id),
        stage: stage as "pickup" | "delivery",
        riderId: user.userId,
        photoCount: proofCount,
      });

      return NextResponse.json({ success: true, message: "Proof uploaded", data: job.proof });
    } catch (error: any) {
      console.error("POST logistics jobs proof error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to upload proof" },
        { status: 500 }
      );
    }
  })(request);
}
