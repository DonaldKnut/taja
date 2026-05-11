import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import DeliveryJob from "@/models/DeliveryJob";

export const dynamic = "force-dynamic";

// GET /api/logistics/jobs/mine - active jobs assigned to rider
export async function GET(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const jobs = await DeliveryJob.find({
        rider: user.userId,
        status: { $in: ["reserved", "picked_up"] },
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();
      return NextResponse.json({ success: true, data: jobs });
    } catch (error: any) {
      console.error("GET logistics jobs mine error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch active jobs" },
        { status: 500 }
      );
    }
  })(request);
}
