import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformSettings from "@/models/PlatformSettings";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

function normalizePayments(doc: any) {
  const envPct = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "7");
  const envAutoDays = parseInt(process.env.ESCROW_AUTO_RELEASE_DAYS || "7", 10);
  const payments = doc?.payments || {};

  return {
    platformFeePercentage:
      typeof payments.platformFeePercentage === "number" && payments.platformFeePercentage >= 0
        ? payments.platformFeePercentage
        : envPct,
    autoReleaseDays:
      typeof payments.autoReleaseDays === "number" && payments.autoReleaseDays > 0
        ? payments.autoReleaseDays
        : envAutoDays,
  };
}

// GET /api/admin/settings/payments - Get payment-related platform settings
export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const doc = await PlatformSettings.findOne().lean();
      const payments = normalizePayments(doc);
      return NextResponse.json({
        success: true,
        data: { payments },
      });
    } catch (error: any) {
      console.error("Admin payments settings GET error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to load payment settings" },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/admin/settings/payments - Update payment-related platform settings
export async function PUT(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const body = await request.json();

      const rawPct = Number(body?.payments?.platformFeePercentage);
      const rawDays = Number(body?.payments?.autoReleaseDays);

      if (!Number.isFinite(rawPct) || rawPct < 0 || rawPct > 100) {
        return NextResponse.json(
          { success: false, message: "Platform fee percentage must be between 0 and 100." },
          { status: 400 }
        );
      }

      if (!Number.isFinite(rawDays) || rawDays <= 0 || rawDays > 60) {
        return NextResponse.json(
          { success: false, message: "Auto-release days must be between 1 and 60." },
          { status: 400 }
        );
      }

      const doc = await PlatformSettings.findOneAndUpdate(
        {},
        {
          $set: {
            "payments.platformFeePercentage": rawPct,
            "payments.autoReleaseDays": Math.round(rawDays),
          },
        },
        { upsert: true, new: true }
      ).lean();

      const payments = normalizePayments(doc);

      return NextResponse.json({
        success: true,
        message: "Payment settings updated",
        data: { payments },
      });
    } catch (error: any) {
      console.error("Admin payments settings PUT error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to update payment settings" },
        { status: 500 }
      );
    }
  })(request);
}

