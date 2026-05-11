import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import DeliveryJob from "@/models/DeliveryJob";

export const dynamic = "force-dynamic";

// GET /api/admin/logistics/jobs - list dispatch jobs
export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const status = String(searchParams.get("status") || "").trim();
      const page = Math.max(1, Number(searchParams.get("page") || "1"));
      const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
      const skip = (page - 1) * limit;
      const query: Record<string, any> = {};
      if (status) query.status = status;

      const [items, total] = await Promise.all([
        DeliveryJob.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        DeliveryJob.countDocuments(query),
      ]);
      return NextResponse.json({
        success: true,
        data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      });
    } catch (error: any) {
      console.error("GET admin logistics jobs error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to load delivery jobs" },
        { status: 500 }
      );
    }
  })(request);
}
