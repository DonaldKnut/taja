import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import User from "@/models/User";
import { requireAuth } from "@/lib/middleware";
import { logisticsPartnerQueryForAuthUser } from "@/lib/logisticsPartnerLookup";
import { notifyAdminsLogisticsPartnerEmailVerified } from "@/lib/logisticsAdminNotify";

export const dynamic = "force-dynamic";

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  return requireAuth(async (_req, authUser) => {
    try {
      await connectDB();
      const body = await request.json();
      const { code } = body || {};
      if (!code || String(code).trim().length !== 6) {
        return NextResponse.json({ success: false, message: "Enter a valid 6-digit OTP" }, { status: 400 });
      }

      const query = await logisticsPartnerQueryForAuthUser(authUser.userId);
      const partner = await LogisticsPartner.findOne(query).select("+verification.emailOtp.codeHash");
      if (!partner) {
        return NextResponse.json({ success: false, message: "Logistics profile not found" }, { status: 404 });
      }
      if (!partner.user || String(partner.user) !== String(authUser.userId)) {
        partner.set({ user: authUser.userId });
      }

      const otp = partner.verification?.emailOtp;
      if (!otp?.codeHash || !otp.expiresAt) {
        return NextResponse.json({ success: false, message: "Request OTP first" }, { status: 400 });
      }
      if (new Date(otp.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ success: false, message: "OTP expired. Request a new one." }, { status: 400 });
      }
      if ((otp.attempts || 0) >= 5) {
        return NextResponse.json({ success: false, message: "Too many failed attempts. Request a new OTP." }, { status: 429 });
      }

      const valid = hashOtp(String(code).trim()) === otp.codeHash;
      if (!valid) {
        partner.verification = partner.verification || {};
        partner.verification.emailOtp = {
          ...otp,
          attempts: (otp.attempts || 0) + 1,
        };
        await partner.save();
        return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
      }

      partner.verification = partner.verification || {};
      partner.verification.emailOtp = {
        ...otp,
        verifiedAt: new Date(),
        attempts: 0,
      };
      await partner.save();

      const riderUser = await User.findById(authUser.userId).select("email fullName").lean();
      void notifyAdminsLogisticsPartnerEmailVerified({
        partnerId: String(partner._id),
        partnerName: partner.fullName || (riderUser as { fullName?: string } | null)?.fullName || "Partner",
        email: (riderUser as { email?: string } | null)?.email || partner.email,
      });

      return NextResponse.json({ success: true, message: "Email OTP verified successfully" });
    } catch (error: any) {
      console.error("POST logistics otp verify error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to verify OTP" },
        { status: 500 }
      );
    }
  })(request);
}
