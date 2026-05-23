import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { requireRole } from "@/lib/middleware";

export const dynamic = "force-dynamic";

function toCsvValue(value: any) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      const paymentStatus = searchParams.get("paymentStatus");
      const escrowStatus = searchParams.get("escrowStatus");
      const search = searchParams.get("search");

      const query: any = { isDeleted: { $ne: true } };

      if (status) query.status = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (escrowStatus) query.escrowStatus = escrowStatus;
      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: "i" } },
          { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        ];
      }

      const orders = await Order.find(query)
        .populate("buyer", "fullName email phone")
        .populate("seller", "fullName email phone")
        .populate("shop", "shopName shopSlug")
        .sort({ createdAt: -1 })
        .lean();

      const header = [
        "Order ID",
        "Order Number",
        "Created At",
        "Buyer Name",
        "Buyer Email",
        "Buyer Phone",
        "Seller Name",
        "Seller Email",
        "Shop Name",
        "Shop Slug",
        "Status",
        "Payment Status",
        "Escrow Status",
        "Subtotal",
        "Shipping",
        "Tax",
        "Discount",
        "Total",
        "Delivery Zone",
        "Delivery Quote Estimate",
        "Delivery Quote Version",
      ];

      const rows = orders.map((o: any) => [
        o._id,
        o.orderNumber,
        o.createdAt?.toISOString?.() || o.createdAt,
        o.buyer?.fullName,
        o.buyer?.email,
        o.buyer?.phone,
        o.seller?.fullName,
        o.seller?.email,
        o.shop?.shopName,
        o.shop?.shopSlug,
        o.status,
        o.paymentStatus,
        o.escrowStatus,
        o.totals?.subtotal,
        o.totals?.shipping,
        o.totals?.tax,
        o.totals?.discount,
        o.totals?.total,
        o.deliveryQuoteSnapshot?.zoneLabel,
        o.deliveryQuoteSnapshot?.isEstimate ? "yes" : "",
        o.deliveryQuoteSnapshot?.version,
      ]);

      const csv = [header, ...rows]
        .map((row) => row.map(toCsvValue).join(","))
        .join("\n");

      const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      console.error("Admin orders export error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to export orders" },
        { status: 500 }
      );
    }
  })(request);
}

