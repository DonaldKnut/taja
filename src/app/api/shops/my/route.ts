import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import { requireAuth } from "@/lib/middleware";

export const dynamic = "force-dynamic";

/**
 * GET /api/shops/my - Get the current user's shop (if any).
 * Used to know if the user has already set up a shop (one per user).
 * Returns 200 with shop data or 200 with data: null if they have no shop.
 */
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      console.log("[MY_SHOP] Fetching shop for user:", user.userId);

      await connectDB();

      const shop = await Shop.findOne({ owner: user.userId }).lean();

      if (shop) {
        console.log("[MY_SHOP] ✅ Shop found:", shop._id);
      } else {
        console.log("[MY_SHOP] No shop found for user:", user.userId);
      }

      return NextResponse.json({
        success: true,
        data: shop || null,
      });
    } catch (error: any) {
      console.error("[MY_SHOP] ❌ Error fetching shop:", {
        userId: user.userId,
        error: error.message,
        stack: error.stack,
        name: error.name,
      });

      return NextResponse.json(
        { success: false, message: error.message || "Failed to get shop" },
        { status: 500 },
      );
    }
  })(request);
}
