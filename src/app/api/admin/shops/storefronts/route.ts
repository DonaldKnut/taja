import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import User from "@/models/User";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// GET /api/admin/shops/storefronts - List storefronts with summary data (admin only)
export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const search = (request.nextUrl.searchParams.get("search") || "").trim();
      const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 100), 300);
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.FRONTEND_URL ||
        "https://tajaapp.shop";

      const query: Record<string, unknown> = {};
      if (search) {
        const matchedOwners = await User.find(
          {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
          { _id: 1 }
        )
          .limit(200)
          .lean();
        const ownerIds = matchedOwners.map((u: any) => u._id);
        query.$or = [
          { shopName: { $regex: search, $options: "i" } },
          { shopSlug: { $regex: search, $options: "i" } },
          ...(ownerIds.length ? [{ owner: { $in: ownerIds } }] : []),
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
          links: {
            live: `${baseUrl.replace(/\/$/, "")}/shop/${shop.shopSlug}`,
            shopEdit: `/admin/shops/${String(shop._id)}/edit`,
            addProduct: `/admin/products/new?shopId=${String(shop._id)}`,
            ownerLookup: shop.owner?.email
              ? `/admin/users?search=${encodeURIComponent(shop.owner.email)}`
              : "/admin/users",
          },
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
