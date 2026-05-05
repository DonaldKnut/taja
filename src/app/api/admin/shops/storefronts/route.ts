import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// GET /api/admin/shops/storefronts - List storefronts with summary data (admin only)
export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const search = (request.nextUrl.searchParams.get("search") || "").trim();
      const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 100), 300);

      const query: Record<string, unknown> = {};
      if (search) {
        query.$or = [
          { shopName: { $regex: search, $options: "i" } },
          { shopSlug: { $regex: search, $options: "i" } },
        ];
      }

      const shops = await Shop.find(query)
        .populate("owner", "fullName email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const shopIds = shops.map((s: any) => s._id);
      const counts = await Product.aggregate([
        { $match: { shop: { $in: shopIds } } },
        { $group: { _id: "$shop", count: { $sum: 1 } } },
      ]);
      const countMap = new Map<string, number>(
        counts.map((c: any) => [String(c._id), Number(c.count || 0)])
      );

      return NextResponse.json({
        success: true,
        data: shops.map((shop: any) => ({
          _id: String(shop._id),
          shopName: shop.shopName,
          shopSlug: shop.shopSlug,
          status: shop.status || "pending",
          verificationStatus: shop?.verification?.status || "pending",
          category: shop.category || null,
          categories: Array.isArray(shop.categories) ? shop.categories : [],
          createdAt: shop.createdAt,
          productCount: countMap.get(String(shop._id)) || 0,
          owner: shop.owner
            ? {
                _id: String(shop.owner._id),
                fullName: shop.owner.fullName || "Unknown",
                email: shop.owner.email || "",
              }
            : null,
        })),
      });
    } catch (error: any) {
      console.error("GET admin storefronts error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch storefronts" },
        { status: 500 }
      );
    }
  })(request);
}
