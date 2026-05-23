import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import { requireAuth } from "@/lib/middleware";
import { logisticsPartnerQueryForAuthUser } from "@/lib/logisticsPartnerLookup";

export const dynamic = "force-dynamic";

// GET /api/logistics/me - fetch current user's logistics profile
export async function GET(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const query = await logisticsPartnerQueryForAuthUser(user.userId);
      const profile = await LogisticsPartner.findOne(query).lean();
      if (!profile) {
        return NextResponse.json({ success: true, data: null });
      }

      const eligibleForAssignment =
        profile.status === "approved" &&
        profile.trust?.kycStatus === "verified" &&
        profile.trust?.guarantorFormStatus === "approved" &&
        Boolean(profile.verification?.emailOtp?.verifiedAt) &&
        profile.risk?.level !== "blacklist" &&
        Boolean(profile.availability?.isOnline);
      const requiresGuarantorForm =
        profile.status === "approved" &&
        profile.trust?.kycStatus === "verified" &&
        profile.trust?.guarantorFormStatus !== "approved";
      const payoutHoldActive =
        Boolean(profile.payout?.holdUntil) &&
        new Date(String(profile.payout?.holdUntil)).getTime() > Date.now();

      return NextResponse.json({
        success: true,
        data: {
          ...profile,
          eligibleForAssignment,
          requiresGuarantorForm,
          emailOtpVerified: Boolean(profile.verification?.emailOtp?.verifiedAt),
          payoutHoldActive,
        },
      });
    } catch (error: any) {
      console.error("GET logistics me error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch logistics profile" },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/logistics/me - toggle availability and profile notes
export async function PUT(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const { isOnline, activeHours, notes } = body || {};
      const query = await logisticsPartnerQueryForAuthUser(user.userId);
      const profile = await LogisticsPartner.findOne(query);
      if (!profile) {
        return NextResponse.json({ success: false, message: "Logistics profile not found" }, { status: 404 });
      }
      if (
        Boolean(isOnline) &&
        (profile.status !== "approved" ||
          profile.risk?.level === "blacklist" ||
          profile.trust?.kycStatus !== "verified" ||
          profile.trust?.guarantorFormStatus !== "approved")
      ) {
        return NextResponse.json(
          { success: false, message: "Complete verification and guarantor approval before going online" },
          { status: 403 }
        );
      }

      const userLink =
        profile.user && String(profile.user) === String(user.userId)
          ? {}
          : { user: user.userId };

      const updated = await LogisticsPartner.findOneAndUpdate(
        { _id: profile._id },
        {
          $set: {
            ...userLink,
            "availability.isOnline": Boolean(isOnline),
            "availability.activeHours": activeHours ? String(activeHours).trim() : undefined,
            notes: notes ? String(notes).trim() : undefined,
          },
        },
        { new: true }
      ).lean();

      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("PUT logistics me error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to update logistics profile" },
        { status: 500 }
      );
    }
  })(request);
}
