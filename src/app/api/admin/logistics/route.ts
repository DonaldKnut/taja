import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// GET /api/admin/logistics - list logistics applications and partners
export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
      const status = (searchParams.get("status") || "").trim();
      const kycStatus = (searchParams.get("kycStatus") || "").trim();
      const search = (searchParams.get("search") || "").trim();
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {};
      if (status) query.status = status;
      if (kycStatus) query["trust.kycStatus"] = kycStatus;
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { "coverage.city": { $regex: search, $options: "i" } },
          { "coverage.state": { $regex: search, $options: "i" } },
        ];
      }

      const [items, total] = await Promise.all([
        LogisticsPartner.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        LogisticsPartner.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("GET admin logistics error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch logistics partners" },
        { status: 500 }
      );
    }
  })(request);
}
