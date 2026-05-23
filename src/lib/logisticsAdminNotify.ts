/**
 * In-app notifications + email for all admin users on logistics events.
 * Requires mail: RESEND_API_KEY and/or SMTP_* (see mail-delivery.ts). In-app always attempts.
 */

import connectDB from "@/lib/db";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";
import { deliverHtmlMail, isMailConfigured } from "@/lib/mail-delivery";

function baseUrl() {
  return process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || "https://tajaapp.shop";
}

function escapeHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function notifyAdminsLogisticsCore(opts: {
  title: string;
  message: string;
  htmlInner: string;
  adminPath: string;
  priority?: "low" | "normal" | "high" | "urgent";
  metadata?: Record<string, unknown>;
}) {
  const path = opts.adminPath.startsWith("/") ? opts.adminPath : `/${opts.adminPath}`;
  const actionUrl = `${baseUrl()}${path}`;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px;background:#fafafa;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">${escapeHtml(opts.title)}</h2>
      <div style="margin:0 0 16px;color:#374151;line-height:1.55;font-size:14px;">${opts.htmlInner}</div>
      <p style="margin:0;"><a href="${actionUrl}" style="display:inline-block;padding:12px 22px;background:#0f766e;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Open admin logistics</a></p>
    </div>`;

  try {
    await connectDB();
    const admins = await User.find({ role: "admin" }).select("_id email").lean();
    for (const admin of admins) {
      const userId = String((admin as { _id: { toString: () => string } })._id);
      try {
        await createNotification({
          userId,
          type: "system",
          title: opts.title,
          message: opts.message,
          link: actionUrl,
          actionUrl,
          priority: opts.priority || "high",
          metadata: { channel: "logistics", ...opts.metadata },
        });
      } catch (e) {
        console.error("[logisticsAdminNotify] createNotification failed:", e);
      }
      const email = (admin as { email?: string }).email?.trim();
      if (email && isMailConfigured()) {
        const r = await deliverHtmlMail({
          to: email,
          subject: `[Taja Logistics] ${opts.title}`,
          html,
        });
        if (!r.ok) console.warn("[logisticsAdminNotify] email:", r.error);
      }
    }
  } catch (e) {
    console.error("[logisticsAdminNotify] notifyAdminsLogisticsCore failed:", e);
  }
}

export async function notifyAdminsLogisticsApplicationSubmitted(params: {
  partnerId: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  vehicleType: string;
}) {
  const { partnerId, fullName, email, phone, city, state, vehicleType } = params;
  await notifyAdminsLogisticsCore({
    title: "New logistics application",
    message: `${fullName} applied for logistics (${city}, ${state}). Review in admin.`,
    htmlInner: `<p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Vehicle:</strong> ${escapeHtml(vehicleType)}</p>
      <p><strong>Coverage:</strong> ${escapeHtml(city)}, ${escapeHtml(state)}</p>
      <p><strong>Profile ID:</strong> <code>${escapeHtml(partnerId)}</code></p>`,
    adminPath: "/admin/logistics",
    metadata: { partnerId, event: "application_submitted" },
  });
}

export async function notifyAdminsLogisticsGuarantorSubmitted(params: {
  partnerId: string;
  partnerName: string;
  guarantorName: string;
}) {
  const { partnerId, partnerName, guarantorName } = params;
  await notifyAdminsLogisticsCore({
    title: "Guarantor form submitted",
    message: `${partnerName} submitted a guarantor form (${guarantorName}). Review in admin.`,
    htmlInner: `<p><strong>Partner:</strong> ${escapeHtml(partnerName)}</p>
      <p><strong>Guarantor (submitted as):</strong> ${escapeHtml(guarantorName)}</p>
      <p><strong>Profile ID:</strong> <code>${escapeHtml(partnerId)}</code></p>`,
    adminPath: "/admin/logistics",
    metadata: { partnerId, event: "guarantor_submitted" },
  });
}

export async function notifyAdminsLogisticsJobBroadcastCreated(params: {
  jobId: string;
  orderId: string;
  orderNumber?: string;
  pickupCity: string;
  pickupState: string;
}) {
  const { jobId, orderId, orderNumber, pickupCity, pickupState } = params;
  const ord = orderNumber || orderId.slice(-8);
  await notifyAdminsLogisticsCore({
    title: "Delivery job broadcast created",
    message: `Open job for order #${ord} (${pickupCity}). Riders can claim until expiry.`,
    htmlInner: `<p>A delivery job was broadcast for nearby riders.</p>
      <p><strong>Order:</strong> ${escapeHtml(ord)}</p>
      <p><strong>Pickup area:</strong> ${escapeHtml(pickupCity)}, ${escapeHtml(pickupState)}</p>
      <p><strong>Job ID:</strong> <code>${escapeHtml(jobId)}</code></p>
      <p style="font-size:12px;color:#6b7280;">Pickup/delivery OTPs are shown only in the admin panel response — do not share via unsecured channels.</p>`,
    adminPath: "/admin/logistics",
    metadata: { jobId, orderId, event: "job_broadcast" },
  });
}

export async function notifyAdminsLogisticsJobClaimed(params: {
  jobId: string;
  orderId: string;
  orderNumber?: string;
  riderName: string;
  riderId: string;
}) {
  const { jobId, orderId, orderNumber, riderName, riderId } = params;
  const ord = orderNumber || orderId.slice(-8);
  await notifyAdminsLogisticsCore({
    title: "Delivery job claimed",
    message: `${riderName} claimed job for order #${ord}.`,
    htmlInner: `<p><strong>Rider:</strong> ${escapeHtml(riderName)}</p>
      <p><strong>Rider user ID:</strong> <code>${escapeHtml(riderId)}</code></p>
      <p><strong>Order:</strong> ${escapeHtml(ord)}</p>
      <p><strong>Job ID:</strong> <code>${escapeHtml(jobId)}</code></p>`,
    adminPath: "/admin/logistics",
    metadata: { jobId, orderId, riderId, event: "job_claimed" },
  });
}

export async function notifyAdminsLogisticsJobProofUploaded(params: {
  jobId: string;
  stage: "pickup" | "delivery";
  riderId: string;
  photoCount: number;
}) {
  const { jobId, stage, riderId, photoCount } = params;
  await notifyAdminsLogisticsCore({
    title: `${stage === "pickup" ? "Pickup" : "Delivery"} proof uploaded`,
    message: `Rider uploaded ${stage} proof on job ${jobId.slice(-8)} (${photoCount} photo(s)).`,
    htmlInner: `<p><strong>Stage:</strong> ${escapeHtml(stage)}</p>
      <p><strong>Job ID:</strong> <code>${escapeHtml(jobId)}</code></p>
      <p><strong>Rider ID:</strong> <code>${escapeHtml(riderId)}</code></p>
      <p><strong>Photos in stage:</strong> ${photoCount}</p>`,
    adminPath: "/admin/logistics",
    metadata: { jobId, stage, event: "proof_uploaded" },
  });
}

export async function notifyAdminsLogisticsJobReleasedToQueue(params: { jobId: string; ttlMinutes: number }) {
  const { jobId, ttlMinutes } = params;
  await notifyAdminsLogisticsCore({
    title: "Delivery job released to queue",
    message: `Job ${jobId.slice(-8)} was reopened for claiming (${ttlMinutes} min window).`,
    htmlInner: `<p>An admin released this job back to <strong>open</strong> so another rider can claim it.</p>
      <p><strong>Job ID:</strong> <code>${escapeHtml(jobId)}</code></p>
      <p><strong>New broadcast TTL:</strong> ${ttlMinutes} minutes</p>`,
    adminPath: "/admin/logistics",
    metadata: { jobId, event: "job_released" },
  });
}

export async function notifyAdminsLogisticsJobOtpVerified(params: {
  jobId: string;
  orderId: string;
  orderNumber?: string;
  stage: "pickup" | "delivery";
  newStatus: string;
}) {
  const { jobId, orderId, orderNumber, stage, newStatus } = params;
  const ord = orderNumber || orderId.slice(-8);
  await notifyAdminsLogisticsCore({
    title: stage === "pickup" ? "Pickup OTP verified" : "Delivery OTP verified",
    message: `Order #${ord}: job status is now ${newStatus}.`,
    htmlInner: `<p><strong>Order:</strong> ${escapeHtml(ord)}</p>
      <p><strong>Job ID:</strong> <code>${escapeHtml(jobId)}</code></p>
      <p><strong>Stage:</strong> ${escapeHtml(stage)}</p>
      <p><strong>New status:</strong> ${escapeHtml(newStatus)}</p>`,
    adminPath: "/admin/logistics",
    metadata: { jobId, orderId, stage, event: "otp_verified" },
  });
}

export async function notifyAdminsLogisticsPartnerAdminReview(params: {
  partnerId: string;
  partnerName: string;
  summaryLines: string[];
}) {
  const inner = params.summaryLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  await notifyAdminsLogisticsCore({
    title: "Logistics profile updated (admin)",
    message: `${params.partnerName}: ${params.summaryLines.join(" · ")}`,
    htmlInner: `<p><strong>Partner:</strong> ${escapeHtml(params.partnerName)}</p>
      <p><strong>Profile ID:</strong> <code>${escapeHtml(params.partnerId)}</code></p>
      ${inner}`,
    adminPath: "/admin/logistics",
    priority: "normal",
    metadata: { partnerId: params.partnerId, event: "admin_profile_patch" },
  });
}

export async function notifyAdminsLogisticsPartnerEmailVerified(params: {
  partnerId: string;
  partnerName: string;
  email: string;
}) {
  const { partnerId, partnerName, email } = params;
  await notifyAdminsLogisticsCore({
    title: "Logistics partner verified email",
    message: `${partnerName} verified their logistics profile email.`,
    htmlInner: `<p><strong>Partner:</strong> ${escapeHtml(partnerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Profile ID:</strong> <code>${escapeHtml(partnerId)}</code></p>`,
    adminPath: "/admin/logistics",
    priority: "normal",
    metadata: { partnerId, event: "email_otp_verified" },
  });
}
