import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import LogisticsPartner from "@/models/LogisticsPartner";
import DeliveryJob from "@/models/DeliveryJob";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// GET /api/logistics/jobs/nearby - list open jobs for eligible rider
export async function GET(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();

      const currentUser = await User.findById(user.userId).select("email").lean();
      const query: Record<string, any> = { $or: [{ user: user.userId }] };
      if (currentUser?.email) {
        query.$or.push({ email: String(currentUser.email).toLowerCase() });
      }

      const profile = await LogisticsPartner.findOne(query).lean();
      if (!profile) {
        return NextResponse.json(
          { success: false, message: "Logistics profile not found" },
          { status: 404 }
        );
      }

      const eligible =
        profile.status === "approved" &&
        profile.trust?.kycStatus === "verified" &&
        profile.trust?.guarantorFormStatus === "approved" &&
        profile.risk?.level !== "blacklist";
      if (!eligible) {
        return NextResponse.json(
          { success: false, message: "Complete trust requirements before viewing jobs" },
          { status: 403 }
        );
      }

      const now = new Date();
      const city = String(profile.coverage?.city || "").trim();
      const state = String(profile.coverage?.state || "").trim();
      const maxOrderValueKobo = Number(profile.assignment?.maxOrderValueKobo || 0);

      const jobs = await DeliveryJob.find({
        status: "open",
        "broadcast.expiresAt": { $gt: now },
        "pickup.city": city,
        "pickup.state": state,
        valueKobo: { $lte: maxOrderValueKobo || Number.MAX_SAFE_INTEGER },
      })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean();

      return NextResponse.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error("GET logistics jobs nearby error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to load nearby jobs" },
        { status: 500 }
      );
    }
  })(request);
}
