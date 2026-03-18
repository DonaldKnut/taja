import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { sendBroadcastEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/admin/kyc/reminder
// Admin-only: send a KYC reminder notification to users whose KYC has not started.
export async function POST(request: NextRequest) {
  return requireRole(["admin"])(async () => {
    try {
      const body = await request.json();
      const { userId, message, title } = body as {
        userId?: string;
        message?: string;
        title?: string;
      };

      if (!userId) {
        return NextResponse.json(
          { success: false, message: "userId is required" },
          { status: 400 }
        );
      }

      await connectDB();

      const user = await User.findById(userId).select("email fullName kyc").lean();
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const kycStatus = user.kyc?.status || "not_started";
      if (kycStatus !== "not_started") {
        return NextResponse.json(
          {
            success: false,
            message: `KYC reminder is only available for users with status "not_started" (current: ${kycStatus})`,
          },
          { status: 409 }
        );
      }

      const onboardingLink = "/onboarding/kyc";
      const notifTitle = title || "KYC Reminder";
      const notifMessage =
        message ||
        `Hi ${user.fullName || "there"}, it looks like you haven't started your KYC yet. Please complete it here: ${onboardingLink}.`;

      const notification = await Notification.create({
        user: userId,
        type: "system",
        title: notifTitle,
        message: notifMessage,
        link: onboardingLink,
        priority: "normal",
        read: false,
        metadata: { kycReminder: true, previousKycStatus: "not_started" },
      });

      // Optional email (best-effort; never fail the request if email fails)
      if (user.email) {
        try {
          const baseUrl =
            process.env.FRONTEND_URL ||
            process.env.NEXTAUTH_URL ||
            "https://tajaapp.shop";

          await sendBroadcastEmail(
            user.email,
            notifTitle,
            `
              <p style="font-size:14px;color:#111827;line-height:1.6;">
                ${notifMessage}
              </p>
              <p style="margin-top:18px;">
                <a href="${baseUrl}${onboardingLink}" style="display:inline-block;background:#0f172a;color:white;padding:10px 22px;border-radius:999px;font-size:13px;font-weight:800;text-decoration:none;">
                  Start KYC
                </a>
              </p>
            `,
            user.fullName
          );
        } catch (emailError) {
          console.error("Failed to send KYC reminder email:", emailError);
        }
      }

      return NextResponse.json({
        success: true,
        message: "KYC reminder sent successfully",
        data: notification,
      });
    } catch (error: any) {
      console.error("POST /api/admin/kyc/reminder error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to send reminder" },
        { status: 500 }
      );
    }
  })(request);
}

