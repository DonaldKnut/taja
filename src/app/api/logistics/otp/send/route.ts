import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import { requireAuth } from "@/lib/middleware";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const profile = await LogisticsPartner.findOne({ user: user.userId });
      if (!profile) {
        return NextResponse.json({ success: false, message: "Logistics profile not found" }, { status: 404 });
      }

      const now = Date.now();
      const lastSentAt = profile.verification?.emailOtp?.lastSentAt
        ? new Date(profile.verification.emailOtp.lastSentAt).getTime()
        : 0;
      if (lastSentAt && now - lastSentAt < 60_000) {
        return NextResponse.json(
          { success: false, message: "Please wait before requesting another OTP" },
          { status: 429 }
        );
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(now + 10 * 60 * 1000);

      profile.verification = profile.verification || {};
      profile.verification.emailOtp = {
        codeHash: hashOtp(code),
        expiresAt,
        lastSentAt: new Date(now),
        attempts: 0,
        verifiedAt: profile.verification.emailOtp?.verifiedAt,
      };
      await profile.save();

      const emailResult = await sendVerificationEmail(profile.email, profile.fullName, code);
      if (!emailResult?.success) {
        return NextResponse.json(
          { success: false, message: "Email service not configured. Configure SMTP/Resend to send OTP." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent to your email",
      });
    } catch (error: any) {
      console.error("POST logistics otp send error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to send OTP" },
        { status: 500 }
      );
    }
  })(request);
}
