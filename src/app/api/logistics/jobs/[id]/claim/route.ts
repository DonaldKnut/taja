import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import LogisticsPartner from "@/models/LogisticsPartner";
import DeliveryJob from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// POST /api/logistics/jobs/:id/claim - first valid rider to claim wins
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const currentUser = await User.findById(user.userId).select("email").lean();
      const profileQuery: Record<string, any> = { $or: [{ user: user.userId }] };
      if (currentUser?.email) {
        profileQuery.$or.push({ email: String(currentUser.email).toLowerCase() });
      }
      const profile = await LogisticsPartner.findOne(profileQuery).lean();
      if (!profile) {
        return NextResponse.json({ success: false, message: "Logistics profile not found" }, { status: 404 });
      }

      const eligible =
        profile.status === "approved" &&
        profile.trust?.kycStatus === "verified" &&
        profile.trust?.guarantorFormStatus === "approved" &&
        profile.risk?.level !== "blacklist";
      if (!eligible) {
        return NextResponse.json(
          { success: false, message: "Profile not eligible for claiming delivery jobs" },
          { status: 403 }
        );
      }

      const activeCount = await DeliveryJob.countDocuments({
        rider: user.userId,
        status: { $in: ["reserved", "picked_up"] },
      });
      const maxConcurrentJobs = Number(profile.assignment?.maxConcurrentJobs || 1);
      if (activeCount >= maxConcurrentJobs) {
        return NextResponse.json(
          { success: false, message: "You have reached your active job limit" },
          { status: 400 }
        );
      }

      const now = new Date();
      const claimed = await DeliveryJob.findOneAndUpdate(
        {
          _id: params.id,
          status: "open",
          "broadcast.expiresAt": { $gt: now },
          valueKobo: { $lte: Number(profile.assignment?.maxOrderValueKobo || Number.MAX_SAFE_INTEGER) },
          "pickup.city": String(profile.coverage?.city || "").trim(),
          "pickup.state": String(profile.coverage?.state || "").trim(),
        },
        {
          $set: {
            status: "reserved",
            rider: user.userId,
            "claim.claimedAt": now,
            "claim.claimExpiresAt": new Date(now.getTime() + 20 * 60 * 1000),
          },
        },
        { new: true }
      ).lean();

      if (!claimed) {
        return NextResponse.json(
          { success: false, message: "Job no longer available to claim" },
          { status: 409 }
        );
      }
      await DeliveryEvent.create({
        job: claimed._id,
        actorUserId: user.userId,
        actorRole: "logistics",
        eventType: "job_claimed",
        metadata: {
          claimExpiresAt: claimed?.claim?.claimExpiresAt,
        },
      });

      return NextResponse.json({ success: true, message: "Job claimed", data: claimed });
    } catch (error: any) {
      console.error("POST logistics jobs claim error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to claim job" },
        { status: 500 }
      );
    }
  })(request);
}
