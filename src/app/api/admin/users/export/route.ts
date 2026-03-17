import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
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

      const { searchParams } = new URL(request.url);
      const role = searchParams.get("role");
      const accountStatus = searchParams.get("accountStatus");
      const kycStatus = searchParams.get("kycStatus");
      const search = searchParams.get("search");

      const query: any = {};

      if (role) query.role = role;
      if (accountStatus) query.accountStatus = accountStatus;
      if (kycStatus) query["kyc.status"] = kycStatus;
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .select(
          "fullName email phone role accountStatus kyc.status kyc.submittedAt kyc.bankName kyc.accountNumber kyc.accountName kyc.businessName createdAt"
        )
        .sort({ createdAt: -1 })
        .lean();

      const header = [
        "User ID",
        "Full Name",
        "Email",
        "Phone",
        "Role",
        "Account Status",
        "KYC Status",
        "KYC Submitted At",
        "Business Name",
        "Bank Name",
        "Account Name",
        "Account Number",
        "Created At",
      ];

      const rows = users.map((u: any) => [
        u._id,
        u.fullName,
        u.email,
        u.phone,
        u.role,
        u.accountStatus,
        u.kyc?.status,
        u.kyc?.submittedAt?.toISOString?.() || u.kyc?.submittedAt,
        u.kyc?.businessName,
        u.kyc?.bankName,
        u.kyc?.accountName,
        u.kyc?.accountNumber,
        u.createdAt?.toISOString?.() || u.createdAt,
      ]);

      const csv = [header, ...rows]
        .map((row) => row.map(toCsvValue).join(","))
        .join("\n");

      const filename = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      console.error("Admin users export error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to export users" },
        { status: 500 }
      );
    }
  })(request);
}

