import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import connectDB from "@/lib/db";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET /api/referrals/me - Get referral code + stats
export async function GET(request: NextRequest) {
  return requireAuth(async (req, jwtUser) => {
    try {
      await connectDB();

      let userDoc: any = await User.findById(jwtUser.userId).select("referralCode");
      if (userDoc && !userDoc.referralCode) {
        await userDoc.save({ validateBeforeSave: false });
      }
      const referralCode = userDoc?.referralCode || "";

      const userId = new mongoose.Types.ObjectId(jwtUser.userId);

      const [referredCount, earnedAgg, heldAgg] = await Promise.all([
        User.countDocuments({ referredBy: userId }),
        WalletTransaction.aggregate([
          { $match: { user: userId, type: "referral_bonus", status: "success", direction: "credit", currency: "NGN" } },
          { $group: { _id: "$user", total: { $sum: "$amount" } } },
        ]),
        WalletTransaction.aggregate([
          { $match: { user: userId, type: "referral_bonus", status: "held", direction: "credit", currency: "NGN" } },
          { $group: { _id: "$user", total: { $sum: "$amount" } } },
        ]),
      ]);

      const earnedKobo = earnedAgg?.[0]?.total ?? 0;
      const heldKobo = heldAgg?.[0]?.total ?? 0;

      return NextResponse.json({
        success: true,
        data: {
          referralCode,
          stats: {
            referredUsers: referredCount,
            earned: { kobo: earnedKobo, naira: earnedKobo / 100 },
            pending: { kobo: heldKobo, naira: heldKobo / 100 },
          },
        },
      });
    } catch (error: any) {
      console.error("Referral me error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch referral info" },
        { status: 500 }
      );
    }
  })(request);
}

