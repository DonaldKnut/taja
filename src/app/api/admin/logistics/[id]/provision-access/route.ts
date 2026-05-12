import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import LogisticsPartner from "@/models/LogisticsPartner";
import { requireRole } from "@/lib/middleware";
import { hashPassword } from "@/lib/auth";
import AuditLog from "@/models/AuditLog";

export const dynamic = "force-dynamic";

function generateTempPassword() {
  const base = crypto.randomBytes(12).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `${base}A1`;
}

/** POST — create or reset logistics-only User and link LogisticsPartner (admin). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return requireRole(["admin"])(async (_req, adminUser) => {
    try {
      await connectDB();
      const partner = await LogisticsPartner.findById(params.id);
      if (!partner) {
        return NextResponse.json({ success: false, message: "Logistics partner not found" }, { status: 404 });
      }

      if (partner.status !== "approved") {
        return NextResponse.json(
          {
            success: false,
            message: "Approve the partner before creating rider portal access.",
          },
          { status: 400 }
        );
      }

      const email = String(partner.email || "").toLowerCase().trim();
      if (!email) {
        return NextResponse.json({ success: false, message: "Partner has no email on file" }, { status: 400 });
      }

      const tempPassword = generateTempPassword();
      const hashed = await hashPassword(tempPassword);

      const existing = await User.findOne({ email }).select("_id role").lean();
      if (existing && (existing as { role?: string }).role !== "logistics") {
        return NextResponse.json(
          {
            success: false,
            message:
              "An account with this email already exists as a buyer or seller. Use a different email on the logistics application or contact support.",
          },
          { status: 409 }
        );
      }

      let userId: string;
      if (existing && (existing as { role?: string }).role === "logistics") {
        await User.findByIdAndUpdate((existing as { _id: unknown })._id, {
          $set: {
            password: hashed,
            fullName: partner.fullName || email,
            accountStatus: "active",
            emailVerified: true,
          },
        });
        userId = String((existing as { _id: { toString: () => string } })._id);
      } else {
        const phone = partner.phone ? String(partner.phone).trim() : "";
        const phoneTaken = phone ? !!(await User.exists({ phone })) : false;
        const created = await User.create({
          fullName: partner.fullName || email.split("@")[0],
          email,
          phone: phone && !phoneTaken ? phone : undefined,
          password: hashed,
          role: "logistics",
          roleSelected: true,
          roleSelectionDate: new Date(),
          accountStatus: "active",
          emailVerified: true,
        });
        userId = String(created._id);
      }

      await LogisticsPartner.findByIdAndUpdate(partner._id, {
        $set: { user: userId },
      });

      await AuditLog.create({
        actorUserId: adminUser.userId,
        actorRole: adminUser.role,
        action: "admin.logistics.provision_access",
        entityType: "logistics_partner",
        entityId: String(partner._id),
        metadata: { riderUserId: userId },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "Rider portal access created. Share the temporary password securely; rider signs in at /logistics/login.",
        data: {
          email,
          temporaryPassword: tempPassword,
          riderLoginPath: "/logistics/login",
        },
      });
    } catch (error: unknown) {
      console.error("provision-access error:", error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Provision failed" },
        { status: 500 }
      );
    }
  })(request);
}
