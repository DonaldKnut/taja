import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import DeliveryEvent from "@/models/DeliveryEvent";

export const dynamic = "force-dynamic";

// GET /api/admin/logistics/jobs/:id/events - timeline for custody/support review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const limit = Math.min(
        200,
        Math.max(1, Number(new URL(request.url).searchParams.get("limit") || "100"))
      );
      const items = await DeliveryEvent.find({ job: params.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return NextResponse.json({ success: true, data: items });
    } catch (error: any) {
      console.error("GET admin logistics job events error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to load job timeline" },
        { status: 500 }
      );
    }
  })(request);
}
