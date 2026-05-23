import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import AuditLog from "@/models/AuditLog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const searchParams = request.nextUrl.searchParams;
      const page = Number(searchParams.get("page") || 1);
      const limit = Math.min(100, Number(searchParams.get("limit") || 20));
      const action = (searchParams.get("action") || "").trim();
      const actorUserId = (searchParams.get("actorUserId") || "").trim();
      const entityType = (searchParams.get("entityType") || "").trim();
      const success = searchParams.get("success");
      const from = (searchParams.get("from") || "").trim();
      const to = (searchParams.get("to") || "").trim();

      const query: any = {};
      if (action) query.action = action;
      if (actorUserId) query.actorUserId = actorUserId;
      if (entityType) query.entityType = entityType;
      if (success === "true") query.success = true;
      if (success === "false") query.success = false;
      if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to);
      }

      const skip = (page - 1) * limit;
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .populate("actorUserId", "fullName email role")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.max(1, Math.ceil(total / limit)),
          },
        },
      });
    } catch (error: any) {
      console.error("Get admin audit logs error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch audit logs" },
        { status: 500 }
      );
    }
  })(request);
}

