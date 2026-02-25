import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";

export const dynamic = "force-dynamic";

// GET /api/wallet/transactions - List wallet transactions
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const searchParams = request.nextUrl.searchParams;
      const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
      const status = searchParams.get("status");

      const query: any = { user: user.userId };
      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        WalletTransaction.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          transactions: items,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Wallet transactions error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch wallet transactions" },
        { status: 500 }
      );
    }
  })(request);
}

