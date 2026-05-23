import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { requireAuth } from "@/lib/middleware";
import { getProductViewAnalytics } from "@/lib/productViewAnalytics";

export const dynamic = "force-dynamic";

// GET /api/seller/products/:productId/view-analytics?days=7
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      const raw = params.productId?.trim() || "";
      const days = Number(req.nextUrl.searchParams.get("days") || 7);

      const query = mongoose.Types.ObjectId.isValid(raw)
        ? { _id: raw, seller: user.userId, status: { $ne: "deleted" as const } }
        : { slug: raw, seller: user.userId, status: { $ne: "deleted" as const } };

      const product = await Product.findOne(query).select("_id").lean();
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
      }

      const id = String((product as { _id: unknown })._id);
      const analytics = await getProductViewAnalytics(id, days);

      return NextResponse.json({
        success: true,
        data: { productId: id, ...analytics },
      });
    } catch (error: any) {
      console.error("GET seller view-analytics error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to load analytics" },
        { status: 500 }
      );
    }
  })(request);
}
