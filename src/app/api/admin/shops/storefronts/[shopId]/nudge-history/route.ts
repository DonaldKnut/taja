import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import Notification from "@/models/Notification";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// GET /api/admin/shops/storefronts/[shopId]/nudge-history
export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const limit = Math.min(
        50,
        Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 12))
      );

      const shop: any = await Shop.findById(params.shopId)
        .populate("owner", "fullName email")
        .select("_id shopName shopSlug owner")
        .lean();

      if (!shop) {
        return NextResponse.json(
          { success: false, message: "Shop not found" },
          { status: 404 }
        );
      }

      const ownerId = shop?.owner?._id ? String(shop.owner._id) : "";
      if (!ownerId) {
        return NextResponse.json({
          success: true,
          data: {
            shopId: String(shop._id),
            shopName: shop.shopName,
            history: [],
          },
        });
      }

      const historyRaw: any[] = await Notification.find({
        user: ownerId,
        type: "shop",
        "metadata.shopId": String(shop._id),
        "metadata.kind": { $in: ["product-nudge", "product-nudge-bulk"] },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const history = historyRaw.map((item: any) => ({
        _id: String(item._id),
        title: item.title || "Product nudge",
        message: item.message || "",
        kind: item?.metadata?.kind || "product-nudge",
        minTarget: Number(item?.metadata?.minTarget || 0),
        productCountAtSend: Number(item?.metadata?.productCount || 0),
        shortByAtSend: Number(item?.metadata?.shortBy || 0),
        read: !!item.read,
        createdAt: item.createdAt,
        channel: "in-app",
      }));

      return NextResponse.json({
        success: true,
        data: {
          shopId: String(shop._id),
          shopName: shop.shopName,
          owner: shop.owner
            ? {
                _id: String(shop.owner._id),
                fullName: shop.owner.fullName || "Unknown",
                email: shop.owner.email || "",
              }
            : null,
          history,
        },
      });
    } catch (error: any) {
      console.error("Nudge history error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to fetch nudge history" },
        { status: 500 }
      );
    }
  })(request);
}

