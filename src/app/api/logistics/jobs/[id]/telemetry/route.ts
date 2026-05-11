import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import DeliveryJob from "@/models/DeliveryJob";

export const dynamic = "force-dynamic";

// POST /api/logistics/jobs/:id/telemetry - append rider location ping
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const lat = Number(body?.lat);
      const lng = Number(body?.lng);
      const speedKmh = Number(body?.speedKmh);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json(
          { success: false, message: "lat and lng are required" },
          { status: 400 }
        );
      }

      const updated = await DeliveryJob.findOneAndUpdate(
        {
          _id: params.id,
          rider: user.userId,
          status: { $in: ["reserved", "picked_up"] },
        },
        {
          $push: {
            telemetry: {
              lat,
              lng,
              speedKmh: Number.isFinite(speedKmh) ? speedKmh : undefined,
              capturedAt: new Date(),
            },
          },
        },
        { new: true }
      ).lean();

      if (!updated) {
        return NextResponse.json(
          { success: false, message: "No active assigned job found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, message: "Telemetry accepted" });
    } catch (error: any) {
      console.error("POST logistics jobs telemetry error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed telemetry update" },
        { status: 500 }
      );
    }
  })(request);
}
