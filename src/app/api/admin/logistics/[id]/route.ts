import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import AuditLog from "@/models/AuditLog";
import { requireRole } from "@/lib/middleware";
import { notifyAdminsLogisticsPartnerAdminReview } from "@/lib/logisticsAdminNotify";

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
      const {
        status,
        kycStatus,
        riskLevel,
        riskReasonCode,
        riskReasonNotes,
        trustTier,
        maxOrderValueKobo,
        maxRadiusKm,
        maxConcurrentJobs,
        guarantorFormStatus,
      } = body || {};

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
      const allowedGuarantorStatus = ["not_submitted", "submitted", "approved", "rejected"];

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
      const parsedTier = Number(trustTier);
      if (!Number.isNaN(parsedTier) && [0, 1, 2, 3].includes(parsedTier)) {
        update["trust.trustTier"] = parsedTier;
      }
      if (
        typeof maxOrderValueKobo === "number" &&
        Number.isFinite(maxOrderValueKobo) &&
        maxOrderValueKobo >= 100000
      ) {
        update["assignment.maxOrderValueKobo"] = Math.round(maxOrderValueKobo);
      }
      if (typeof maxRadiusKm === "number" && Number.isFinite(maxRadiusKm) && maxRadiusKm >= 1) {
        update["assignment.maxRadiusKm"] = Math.round(maxRadiusKm);
      }
      if (
        typeof maxConcurrentJobs === "number" &&
        Number.isFinite(maxConcurrentJobs) &&
        maxConcurrentJobs >= 1 &&
        maxConcurrentJobs <= 10
      ) {
        update["assignment.maxConcurrentJobs"] = Math.round(maxConcurrentJobs);
      }
      if (
        guarantorFormStatus &&
        allowedGuarantorStatus.includes(String(guarantorFormStatus))
      ) {
        update["trust.guarantorFormStatus"] = String(guarantorFormStatus);
        update["trust.guarantorForm.reviewedAt"] = new Date();
        update["trust.guarantorForm.reviewedBy"] = user.userId;
      }

      if (Object.keys(update).length === 0) {
        return NextResponse.json({ success: false, message: "No valid update fields provided" }, { status: 400 });
      }

      if (update.status === "suspended" || update["risk.level"] === "blacklist") {
        update["availability.isOnline"] = false;
      }
      if (
        update["trust.guarantorFormStatus"] &&
        update["trust.guarantorFormStatus"] !== "approved"
      ) {
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
            trustTier: before.trust?.trustTier,
            guarantorFormStatus: before.trust?.guarantorFormStatus,
            riskLevel: before.risk?.level,
            riskReasonCode: before.risk?.reasonCode,
          },
          after: {
            status: doc?.status,
            kycStatus: doc?.trust?.kycStatus,
            trustTier: doc?.trust?.trustTier,
            guarantorFormStatus: doc?.trust?.guarantorFormStatus,
            riskLevel: doc?.risk?.level,
            riskReasonCode: doc?.risk?.reasonCode,
          },
          update,
        },
      });

      if (doc) {
        const summaryLines: string[] = [];
        if (update.status && update.status !== before.status) {
          summaryLines.push(`Partner status: ${before.status} → ${doc.status}`);
        }
        if (update["trust.kycStatus"] && update["trust.kycStatus"] !== before.trust?.kycStatus) {
          summaryLines.push(`KYC: ${before.trust?.kycStatus} → ${doc.trust?.kycStatus}`);
        }
        if (
          update["trust.guarantorFormStatus"] &&
          update["trust.guarantorFormStatus"] !== before.trust?.guarantorFormStatus
        ) {
          summaryLines.push(`Guarantor: ${before.trust?.guarantorFormStatus} → ${doc.trust?.guarantorFormStatus}`);
        }
        if (update["risk.level"] && update["risk.level"] !== before.risk?.level) {
          summaryLines.push(`Risk: ${before.risk?.level} → ${doc.risk?.level}`);
        }
        if (typeof update["trust.trustTier"] === "number" && update["trust.trustTier"] !== before.trust?.trustTier) {
          summaryLines.push(`Trust tier: ${before.trust?.trustTier} → ${doc.trust?.trustTier}`);
        }
        if (summaryLines.length > 0) {
          void notifyAdminsLogisticsPartnerAdminReview({
            partnerId: params.id,
            partnerName: doc.fullName || "Partner",
            summaryLines,
          });
        }
      }

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
