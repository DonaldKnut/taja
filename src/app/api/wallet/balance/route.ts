import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET /api/wallet/balance - Get wallet balances (available + held)
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const userId = new mongoose.Types.ObjectId(user.userId);

      const [availableAgg] = await WalletTransaction.aggregate([
        { $match: { user: userId, status: "success", currency: "NGN" } },
        {
          $group: {
            _id: "$user",
            credits: {
              $sum: { $cond: [{ $eq: ["$direction", "credit"] }, "$amount", 0] },
            },
            debits: {
              $sum: { $cond: [{ $eq: ["$direction", "debit"] }, "$amount", 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            balance: { $subtract: ["$credits", "$debits"] },
          },
        },
      ]);

      const [heldAgg] = await WalletTransaction.aggregate([
        { $match: { user: userId, status: "held", currency: "NGN" } },
        {
          $group: {
            _id: "$user",
            credits: {
              $sum: { $cond: [{ $eq: ["$direction", "credit"] }, "$amount", 0] },
            },
            debits: {
              $sum: { $cond: [{ $eq: ["$direction", "debit"] }, "$amount", 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            balance: { $subtract: ["$credits", "$debits"] },
          },
        },
      ]);

      const availableKobo = Math.max(0, availableAgg?.balance ?? 0);
      const heldKobo = Math.max(0, heldAgg?.balance ?? 0);

      return NextResponse.json({
        success: true,
        data: {
          currency: "NGN",
          available: { kobo: availableKobo, naira: availableKobo / 100 },
          held: { kobo: heldKobo, naira: heldKobo / 100 },
        },
      });
    } catch (error: any) {
      console.error("Wallet balance error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch wallet balance" },
        { status: 500 }
      );
    }
  })(request);
}

