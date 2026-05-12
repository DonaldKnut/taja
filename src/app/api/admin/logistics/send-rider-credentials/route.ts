import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import LogisticsPartner from "@/models/LogisticsPartner";
import { requireRole } from "@/lib/middleware";
import { deliverHtmlMail, isMailConfigured } from "@/lib/mail-delivery";
import {
  buildRiderCredentialsEmailHtml,
  buildRiderCredentialsEmailText,
} from "@/lib/emails/riderCredentialsEmail";
import AuditLog from "@/models/AuditLog";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  partnerId: z.string().min(1),
  temporaryPassword: z.string().min(8).max(200),
  isPasswordRotation: z.boolean().optional(),
});

function publicOrigin(req: NextRequest): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "https://taja.shop";
}

/** POST — email rider portal credentials to the partner’s on-file email only (admin). */
export async function POST(request: NextRequest) {
  return requireRole(["admin"])(async (req, adminUser) => {
    try {
      if (!isMailConfigured()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Email is not configured on this server. Set RESEND_API_KEY and EMAIL_FROM (or SMTP) to send rider emails.",
          },
          { status: 503 }
        );
      }

      const json = await req.json().catch(() => ({}));
      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: "Invalid request", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { partnerId, temporaryPassword, isPasswordRotation } = parsed.data;
      await connectDB();
      const partner = await LogisticsPartner.findById(partnerId).select("email fullName status").lean();
      if (!partner) {
        return NextResponse.json({ success: false, message: "Logistics partner not found" }, { status: 404 });
      }

      if ((partner as { status?: string }).status !== "approved") {
        return NextResponse.json(
          { success: false, message: "Only approved partners can receive credential emails." },
          { status: 400 }
        );
      }

      const toEmail = String((partner as { email?: string }).email || "")
        .toLowerCase()
        .trim();
      if (!toEmail) {
        return NextResponse.json({ success: false, message: "Partner has no email on file" }, { status: 400 });
      }

      const riderName = String((partner as { fullName?: string }).fullName || toEmail.split("@")[0] || "Partner");
      const origin = publicOrigin(req);
      const loginUrl = `${origin}/logistics/login`;

      const html = buildRiderCredentialsEmailHtml({
        riderName,
        loginUrl,
        email: toEmail,
        temporaryPassword,
        isPasswordRotation: Boolean(isPasswordRotation),
      });
      const text = buildRiderCredentialsEmailText({
        riderName,
        loginUrl,
        email: toEmail,
        temporaryPassword,
        isPasswordRotation: Boolean(isPasswordRotation),
      });

      const subject = isPasswordRotation
        ? "Your Taja rider portal password was reset"
        : "Your Taja rider portal access";

      const result = await deliverHtmlMail({
        to: toEmail,
        subject,
        html,
        text,
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.error || "Failed to send email" },
          { status: 502 }
        );
      }

      await AuditLog.create({
        actorUserId: adminUser.userId,
        actorRole: adminUser.role,
        action: "admin.logistics.send_rider_credentials_email",
        entityType: "logistics_partner",
        entityId: String(partnerId),
        metadata: { toEmail, via: result.via },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Credentials sent to ${toEmail}`,
        data: { toEmail, via: result.via },
      });
    } catch (error: unknown) {
      console.error("send-rider-credentials error:", error);
      return NextResponse.json(
        { success: false, message: error instanceof Error ? error.message : "Send failed" },
        { status: 500 }
      );
    }
  })(request);
}
