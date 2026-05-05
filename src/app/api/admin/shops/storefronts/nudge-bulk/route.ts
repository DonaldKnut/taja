import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import { requireRole } from "@/lib/middleware";
import { createNotification } from "@/lib/notifications";
import { sendBroadcastEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/admin/shops/storefronts/nudge-bulk
// Sends product-growth reminders to shops below threshold.
export async function POST(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const body = await request.json().catch(() => ({}));
      const minTarget = Math.max(1, Number(body?.minTarget || 10));
      const underCount = Math.max(0, Number(body?.underCount || 5));
      const note = typeof body?.note === "string" ? body.note.trim() : "";
      const limit = Math.min(200, Math.max(1, Number(body?.limit || 100)));

      const shops: any[] = await Shop.find({})
        .populate("owner", "fullName email")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const shopIds = shops.map((s) => s._id);
      const counts = await Product.aggregate([
        { $match: { shop: { $in: shopIds } } },
        { $group: { _id: "$shop", count: { $sum: 1 } } },
      ]);
      const countMap = new Map<string, number>(
        counts.map((c: any) => [String(c._id), Number(c.count || 0)])
      );

      const eligible = shops.filter((shop) => {
        const count = countMap.get(String(shop._id)) || 0;
        return count <= underCount;
      });

      let nudged = 0;
      let emailed = 0;
      const failed: Array<{ shopId: string; reason: string }> = [];

      for (const shop of eligible) {
        try {
          const ownerId = shop?.owner?._id ? String(shop.owner._id) : "";
          if (!ownerId) {
            failed.push({ shopId: String(shop._id), reason: "missing-owner" });
            continue;
          }
          const productCount = countMap.get(String(shop._id)) || 0;
          const shortBy = Math.max(0, minTarget - productCount);

          const title = "Boost your storefront with more products";
          const message = shortBy > 0
            ? `Your shop "${shop.shopName}" currently has ${productCount} products. Please add at least ${shortBy} more to improve visibility and conversion.`
            : `Great momentum on "${shop.shopName}". Please keep uploading fresh products to stay active and visible.`;

          await createNotification({
            userId: ownerId,
            type: "shop",
            title,
            message: note ? `${message} Admin note: ${note}` : message,
            link: "/seller/products/new",
            actionUrl: "/seller/products/new",
            priority: "high",
            metadata: {
              shopId: String(shop._id),
              shopSlug: shop.shopSlug,
              productCount,
              minTarget,
              shortBy,
              kind: "product-nudge-bulk",
            },
          });
          nudged += 1;

          const ownerEmail = shop?.owner?.email;
          if (ownerEmail) {
            const html = `
              <h2>Keep your storefront active on Taja.Shop</h2>
              <p>Hello ${shop?.owner?.fullName || "Seller"},</p>
              <p>Your shop <strong>${shop.shopName}</strong> currently has <strong>${productCount}</strong> product${productCount === 1 ? "" : "s"}.</p>
              <p>We recommend keeping at least <strong>${minTarget}</strong> products listed so buyers have enough options and your shop performs better in discovery.</p>
              ${shortBy > 0 ? `<p>Please upload at least <strong>${shortBy}</strong> more product${shortBy === 1 ? "" : "s"}.</p>` : ""}
              ${note ? `<p><strong>Admin note:</strong> ${note}</p>` : ""}
              <p><a href="${process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || "https://tajaapp.shop"}/seller/products/new" style="display:inline-block;padding:10px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Add Product</a></p>
            `;
            const r: any = await sendBroadcastEmail(
              ownerEmail,
              "Action needed: add more products to your storefront",
              html,
              shop?.owner?.fullName
            );
            if (r && (r.success === undefined || r.success === true || r.data)) {
              emailed += 1;
            }
          }
        } catch (err: any) {
          failed.push({ shopId: String(shop._id), reason: err?.message || "unknown" });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Bulk nudge completed",
        data: {
          scanned: shops.length,
          eligible: eligible.length,
          nudged,
          emailed,
          failed,
        },
      });
    } catch (error: any) {
      console.error("Bulk storefront nudge error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to run bulk nudge" },
        { status: 500 }
      );
    }
  })(request);
}
