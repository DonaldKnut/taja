import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Shop from "@/models/Shop";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const sellerId = searchParams.get("sellerId");

      const match: any = {
        isDeleted: { $ne: true },
        paymentStatus: "paid",
      };

      if (sellerId) {
        match.seller = sellerId;
      }

      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: { seller: "$seller", shop: "$shop" },
            orderCount: { $sum: 1 },
            totalAmount: { $sum: "$totals.total" },
            lastOrderAt: { $max: "$createdAt" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id.seller",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "_id.shop",
            foreignField: "_id",
            as: "shop",
          },
        },
        { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            sellerId: "$seller._id",
            sellerName: "$seller.fullName",
            sellerEmail: "$seller.email",
            sellerPhone: "$seller.phone",
            shopId: "$shop._id",
            shopName: "$shop.shopName",
            shopSlug: "$shop.shopSlug",
            orderCount: 1,
            totalAmount: 1,
            lastOrderAt: 1,
          },
        },
        { $sort: { totalAmount: -1 } },
      ];

      const results = await Order.aggregate(pipeline);

      return NextResponse.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error("Admin seller earnings error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to load seller earnings" },
        { status: 500 }
      );
    }
  })(request);
}

