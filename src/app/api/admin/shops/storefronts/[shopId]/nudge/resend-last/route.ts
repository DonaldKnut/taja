import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import Product from "@/models/Product";
import Notification from "@/models/Notification";
import { requireRole } from "@/lib/middleware";
import { createNotification } from "@/lib/notifications";
import { sendBroadcastEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/admin/shops/storefronts/[shopId]/nudge/resend-last
export async function POST(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();
      const body = await request.json().catch(() => ({}));
      const extraNote = typeof body?.note === "string" ? body.note.trim() : "";

      const shop: any = await Shop.findById(params.shopId)
        .populate("owner", "fullName email")
        .lean();
      if (!shop) {
        return NextResponse.json(
          { success: false, message: "Shop not found" },
          { status: 404 }
        );
      }

      const ownerId = shop?.owner?._id ? String(shop.owner._id) : "";
      if (!ownerId) {
        return NextResponse.json(
          { success: false, message: "This shop has no owner linked" },
          { status: 400 }
        );
      }

      const lastNudge: any = await Notification.findOne({
        user: ownerId,
        type: "shop",
        "metadata.shopId": String(shop._id),
        "metadata.kind": { $in: ["product-nudge", "product-nudge-bulk"] },
      })
        .sort({ createdAt: -1 })
        .lean();

      const minTarget = Math.max(1, Number(lastNudge?.metadata?.minTarget || 10));
      const productCount = await Product.countDocuments({ shop: shop._id });
      const shortBy = Math.max(0, minTarget - productCount);

      const title = "Follow-up: boost your storefront with more products";
      const messageCore =
        shortBy > 0
          ? `Follow-up reminder: your shop "${shop.shopName}" currently has ${productCount} products. Please add at least ${shortBy} more to improve visibility and conversion.`
          : `Follow-up reminder: great momentum on "${shop.shopName}". Keep uploading fresh products to stay active and visible.`;

      const message = extraNote
        ? `${messageCore} Admin note: ${extraNote}`
        : messageCore;

      await createNotification({
        userId: ownerId,
        type: "shop",
        title,
        message,
        link: "/seller/products/new",
        actionUrl: "/seller/products/new",
        priority: "high",
        metadata: {
          shopId: String(shop._id),
          shopSlug: shop.shopSlug,
          productCount,
          minTarget,
          shortBy,
          kind: "product-nudge",
          followUp: true,
          resentFromNotificationId: lastNudge?._id ? String(lastNudge._id) : null,
        },
      });

      let emailSent = false;
      const ownerEmail = shop?.owner?.email;
      if (ownerEmail) {
        const html = `
          <h2>Follow-up reminder for your storefront</h2>
          <p>Hello ${shop?.owner?.fullName || "Seller"},</p>
          <p>Your shop <strong>${shop.shopName}</strong> currently has <strong>${productCount}</strong> product${productCount === 1 ? "" : "s"}.</p>
          <p>We recommend keeping at least <strong>${minTarget}</strong> products listed so buyers have enough options and your shop performs better in discovery.</p>
          ${shortBy > 0 ? `<p>Please upload at least <strong>${shortBy}</strong> more product${shortBy === 1 ? "" : "s"}.</p>` : ""}
          ${extraNote ? `<p><strong>Admin note:</strong> ${extraNote}</p>` : ""}
          <p><a href="${process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || "https://tajaapp.shop"}/seller/products/new" style="display:inline-block;padding:10px 18px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Add Product</a></p>
        `;
        const r: any = await sendBroadcastEmail(
          ownerEmail,
          "Follow-up: add more products to your storefront",
          html,
          shop?.owner?.fullName
        );
        emailSent = !!(r && (r.success === undefined || r.success === true || r.data));
      }

      return NextResponse.json({
        success: true,
        message: "Last nudge resent successfully",
        data: {
          minTarget,
          productCount,
          shortBy,
          emailSent,
        },
      });
    } catch (error: any) {
      console.error("Resend storefront nudge error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to resend last nudge" },
        { status: 500 }
      );
    }
  })(request);
}

