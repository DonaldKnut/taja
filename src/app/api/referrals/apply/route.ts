import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// POST /api/referrals/apply - Apply a referral code to the current user (one-time)
export async function POST(request: NextRequest) {
  return requireAuth(async (req, jwtUser) => {
    try {
      await connectDB();

      const body = await request.json();
      const code = (body?.code || "").toString().trim().toUpperCase();
      if (!code) {
        return NextResponse.json(
          { success: false, message: "Referral code is required" },
          { status: 400 }
        );
      }

      const user = await User.findById(jwtUser.userId).select("referredBy referralCode").lean();
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      if ((user as any).referredBy) {
        return NextResponse.json(
          { success: false, message: "Referral already applied" },
          { status: 400 }
        );
      }

      if (((user as any).referralCode || "").toString().toUpperCase() === code) {
        return NextResponse.json(
          { success: false, message: "You cannot apply your own referral code" },
          { status: 400 }
        );
      }

      const referrer = await User.findOne({ referralCode: code }).select("_id").lean();
      if (!referrer?._id) {
        return NextResponse.json(
          { success: false, message: "Invalid referral code" },
          { status: 400 }
        );
      }

      await User.findByIdAndUpdate(jwtUser.userId, { $set: { referredBy: referrer._id } });
      User.findByIdAndUpdate(referrer._id, { $inc: { "referralStats.totalReferred": 1 } }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "Referral applied successfully",
      });
    } catch (error: any) {
      console.error("Apply referral error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to apply referral" },
        { status: 500 }
      );
    }
  })(request);
}

