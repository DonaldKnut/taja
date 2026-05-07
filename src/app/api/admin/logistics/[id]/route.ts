import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import AuditLog from "@/models/AuditLog";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// PATCH /api/admin/logistics/:id - review logistics profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireRole(["admin"])(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const { status, kycStatus, riskLevel, riskReasonCode, riskReasonNotes } = body || {};

      const update: Record<string, any> = {};
      const allowedStatus = ["pending_review", "approved", "rejected", "suspended"];
      const allowedKyc = ["pending", "verified", "rejected"];
      const allowedRisk = ["normal", "watchlist", "blacklist"];
      const allowedRiskReason = [
        "id_mismatch",
        "suspicious_activity",
        "failed_delivery_pattern",
        "stolen_package_report",
        "duplicate_identity",
        "other",
      ];

      const before = await LogisticsPartner.findById(params.id).lean();
      if (!before) {
        return NextResponse.json({ success: false, message: "Logistics partner not found" }, { status: 404 });
      }

      if (status && allowedStatus.includes(String(status))) {
        update.status = String(status);
      }
      if (kycStatus && allowedKyc.includes(String(kycStatus))) {
        update["trust.kycStatus"] = String(kycStatus);
      }
      if (riskLevel && allowedRisk.includes(String(riskLevel))) {
        update["risk.level"] = String(riskLevel);
      }
      if (riskReasonCode && allowedRiskReason.includes(String(riskReasonCode))) {
        update["risk.reasonCode"] = String(riskReasonCode);
      }
      if (typeof riskReasonNotes === "string") {
        update["risk.reasonNotes"] = riskReasonNotes.trim() || undefined;
      }

      if (Object.keys(update).length === 0) {
        return NextResponse.json({ success: false, message: "No valid update fields provided" }, { status: 400 });
      }

      if (update.status === "suspended" || update["risk.level"] === "blacklist") {
        update["availability.isOnline"] = false;
      }

      const doc = await LogisticsPartner.findByIdAndUpdate(
        params.id,
        { $set: update },
        { new: true }
      ).lean();

      await AuditLog.create({
        actorUserId: user.userId,
        actorRole: user.role,
        action: "admin.logistics.review",
        entityType: "LogisticsPartner",
        entityId: params.id,
        route: request.nextUrl.pathname,
        method: request.method,
        success: true,
        metadata: {
          before: {
            status: before.status,
            kycStatus: before.trust?.kycStatus,
            riskLevel: before.risk?.level,
            riskReasonCode: before.risk?.reasonCode,
          },
          after: {
            status: doc?.status,
            kycStatus: doc?.trust?.kycStatus,
            riskLevel: doc?.risk?.level,
            riskReasonCode: doc?.risk?.reasonCode,
          },
          update,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Logistics profile updated successfully",
        data: doc,
      });
    } catch (error: any) {
      console.error("PATCH admin logistics error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to update logistics profile" },
        { status: 500 }
      );
    }
  })(request);
}
