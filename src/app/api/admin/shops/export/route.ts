import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Shop from "@/models/Shop";
import User from "@/models/User";
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

      const shops = await Shop.find({})
        .populate("owner", "fullName email phone kyc.bankName kyc.accountNumber kyc.accountName")
        .sort({ createdAt: -1 })
        .lean();

      const header = [
        "Shop ID",
        "Shop Name",
        "Shop Slug",
        "Status",
        "Owner ID",
        "Owner Name",
        "Owner Email",
        "Owner Phone",
        "Owner Bank Name",
        "Owner Account Name",
        "Owner Account Number",
        "Total Orders",
        "Total Revenue",
        "Average Rating",
        "Created At",
      ];

      const rows = shops.map((s: any) => {
        const owner: any = s.owner;
        return [
          s._id,
          s.shopName,
          s.shopSlug,
          s.status,
          owner?._id,
          owner?.fullName,
          owner?.email,
          owner?.phone,
          owner?.kyc?.bankName,
          owner?.kyc?.accountName,
          owner?.kyc?.accountNumber,
          s.stats?.totalOrders,
          s.stats?.totalRevenue,
          s.stats?.averageRating,
          s.createdAt?.toISOString?.() || s.createdAt,
        ];
      });

      const csv = [header, ...rows]
        .map((row) => row.map(toCsvValue).join(","))
        .join("\n");

      const filename = `shops-export-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      console.error("Admin shops export error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to export shops" },
        { status: 500 }
      );
    }
  })(request);
}

