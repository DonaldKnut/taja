import fs from "fs";
import path from "path";
import { deliverHtmlMail, isMailConfigured } from "@/lib/mail-delivery";

async function sendTransactionalMail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string,
) {
  const result = await deliverHtmlMail({ to, subject, html, text });
  if (!result.ok) {
    throw new Error(result.error);
  }
  return { success: true as const, data: { via: result.via } };
}

// Load email templates
const loadTemplate = (templateName: string): string => {
  try {
    const templatePath = path.join(
      process.cwd(),
      "src",
      "templates",
      "emails",
      `${templateName}.html`,
    );
    return fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    return "";
  }
};

// Render template with variables (simple string replacement)
const renderTemplate = (
  template: string,
  variables: Record<string, any>,
): string => {
  let rendered = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`<%= ${key} %>`, "g");
    const value = variables[key] || "";
    rendered = rendered.replace(regex, String(value));
  });
  // Handle conditional logo rendering
  if (variables.logoUrl) {
    rendered = rendered.replace(
      /<% if \(typeof logoUrl !== 'undefined' && logoUrl\) \{ %>[\s\S]*?<% \} else \{ %>[\s\S]*?<% \} %>/g,
      `<img src="${variables.logoUrl}" alt="Taja.Shop Logo" style="max-width:200px;height:auto;margin-bottom:12px;" />`,
    );
  } else {
    rendered = rendered
      .replace(
        /<% if \(typeof logoUrl !== 'undefined' && logoUrl\) \{ %>[\s\S]*?<% \} else \{ %>/g,
        "",
      )
      .replace(/<% \} %>/g, "");
  }
  return rendered;
};

/**
 * Send email verification code
 * Requires Resend and/or SMTP (see `src/lib/mail-delivery.ts`).
 * @param email - Recipient email address
 * @param name - Recipient name
 * @param code - 6-digit verification code
 * @returns Success status and data or error
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string,
) {
  if (!isMailConfigured()) {
    console.warn("⚠️  No mail transport (Resend/SMTP). Email verification skipped.");
    console.warn(`   Verification code for ${email}: ${code}`);
    return { success: false, error: "Email service not configured" };
  }
  try {
    const template = loadTemplate("verification");
    const html = renderTemplate(template, {
      name,
      code,
      year: new Date().getFullYear(),
      logoUrl:
        process.env.LOGO_URL ||
        "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
    });

    return await sendTransactionalMail(
      email,
      "Verify your Taja.Shop email",
      html,
    );
  } catch (error) {
    console.error("Send verification email error:", error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Welcome email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const template = loadTemplate("welcome");
    const dashboardUrl = `${process.env.NEXTAUTH_URL || "https://tajaapp.shop"}/dashboard`;
    const html = renderTemplate(template, {
      name,
      dashboardUrl,
      year: new Date().getFullYear(),
      logoUrl:
        process.env.LOGO_URL ||
        "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
    });

    return await sendTransactionalMail(email, "Welcome to Taja.Shop!", html);
  } catch (error) {
    console.error("Send welcome email error:", error);
    throw error;
  }
}

/**
 * Notify a seller that their account / shop has been approved
 * and they can now start listing products.
 */
export async function sendSellerApprovedEmail(
  email: string,
  name: string,
  shopName?: string,
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Seller-approved email skipped.");
    return { success: false, error: "Email service not configured" };
  }

  const baseUrl =
    process.env.FRONTEND_URL ||
    process.env.NEXTAUTH_URL ||
    "https://tajaapp.shop";
  const dashboardUrl = `${baseUrl}/seller/dashboard`;

  const safeName = name || "Seller";
  const safeShopName = shopName || "your shop";

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f7; padding:32px 0;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px 28px;border:1px solid #edf0f4;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="${process.env.LOGO_URL || "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png"}" alt="Taja.Shop" style="max-width:180px;height:auto;margin-bottom:12px;" />
        </div>
        <p style="font-size:14px;color:#111827;margin:0 0 12px;">Hi ${safeName},</p>
        <p style="font-size:14px;color:#111827;margin:0 0 12px;">
          Great news — your seller verification has been <strong>approved</strong> and ${safeShopName} is now cleared to start selling on <strong>Taja.Shop</strong>.
        </p>
        <p style="font-size:14px;color:#111827;margin:0 0 16px;">
          You can now create and publish products, receive orders, and manage your business directly from your Seller Dashboard.
        </p>
        <div style="text-align:center;margin:24px 0 28px;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background:#111827;color:#ffffff;padding:10px 22px;border-radius:999px;font-size:13px;font-weight:600;text-decoration:none;">
            Open Seller Dashboard
          </a>
        </div>
        <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">
          If you didn’t request seller access, please contact support immediately.
        </p>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px;">
          © ${new Date().getFullYear()} Taja.Shop. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    const r = await deliverHtmlMail({
      to: email,
      subject: "Your Taja.Shop seller account is live",
      html,
    });
    if (!r.ok) return { success: false, error: r.error };
    return { success: true, data: r };
  } catch (e) {
    console.error("Send seller approved email error:", e);
    return { success: false, error: e };
  }
}

/**
 * Send email to admin(s) when a user submits KYC (identity/seller verification).
 * Uses ADMIN_EMAIL if set, otherwise sends to all users with role admin.
 */
export async function sendAdminKycSubmittedEmail(
  submitterName: string,
  submitterEmail: string,
  submitterPhone?: string,
  businessName?: string,
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Admin KYC-submitted email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  const baseUrl =
    process.env.FRONTEND_URL ||
    process.env.NEXTAUTH_URL ||
    "https://tajaapp.shop";
  const reviewUrl = `${baseUrl}/admin/kyc`;

  const template = loadTemplate("admin-kyc");
  const html = renderTemplate(template, {
    submitterName,
    submitterEmail,
    businessName: businessName || "—",
    reviewUrl,
    year: new Date().getFullYear(),
    logoUrl:
      process.env.LOGO_URL ||
      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const r = await deliverHtmlMail({
      to: adminEmail,
      subject: `[Taja.Shop] New KYC submission: ${submitterName}`,
      html,
    });
    if (!r.ok) {
      console.error("Mail error (admin KYC submitted):", r.error);
      return { success: false, error: r.error };
    }
    return { success: true, data: r };
  }

  try {
    const { default: User } = await import("@/models/User");
    const { default: connectDB } = await import("@/lib/db");
    await connectDB();
    const admins = await User.find({ role: "admin" }).select("email").lean();
    for (const admin of admins) {
      if (admin.email) {
        const r = await deliverHtmlMail({
          to: admin.email,
          subject: `[Taja.Shop] New KYC submission: ${submitterName}`,
          html,
        });
        if (!r.ok) {
          console.error("Mail error (admin KYC):", r.error);
        }
      }
    }
    return { success: true, data: null };
  } catch (e) {
    console.error("Send admin KYC-submitted email error:", e);
    return { success: false, error: e };
  }
}

/**
 * Send email to admin(s) when a new shop is registered.
 * Uses ADMIN_EMAIL if set (single recipient), otherwise sends to all users with role admin.
 */
export async function sendAdminNewShopEmail(
  shopName: string,
  ownerName: string,
  ownerEmail: string,
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Admin new-shop email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  const baseUrl =
    process.env.FRONTEND_URL ||
    process.env.NEXTAUTH_URL ||
    "https://tajaapp.shop";
  const reviewUrl = `${baseUrl}/admin/kyc`;

  const template = loadTemplate("admin-new-shop");
  const html = renderTemplate(template, {
    shopName,
    ownerName,
    ownerEmail,
    reviewUrl,
    year: new Date().getFullYear(),
    logoUrl:
      process.env.LOGO_URL ||
      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const r = await deliverHtmlMail({
      to: adminEmail,
      subject: `[Taja.Shop] New shop: ${shopName} – under review`,
      html,
    });
    if (!r.ok) {
      console.error("Mail error (admin new shop):", r.error);
      return { success: false, error: r.error };
    }
    return { success: true, data: r };
  }

  // No ADMIN_EMAIL: fetch admin emails from DB and send to each
  try {
    const { default: User } = await import("@/models/User");
    const { default: connectDB } = await import("@/lib/db");
    await connectDB();
    const admins = await User.find({ role: "admin" }).select("email").lean();
    for (const admin of admins) {
      if (admin.email) {
        const r = await deliverHtmlMail({
          to: admin.email,
          subject: `[Taja.Shop] New shop: ${shopName} – under review`,
          html,
        });
        if (!r.ok) console.error("Mail error (admin new shop loop):", r.error);
      }
    }
    return { success: true, data: null };
  } catch (e) {
    console.error("Send admin new-shop email error:", e);
    return { success: false, error: e };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Password reset email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL || "https://tajaapp.shop"}/reset-password/${resetToken}`;
    const template = loadTemplate("password-reset");
    const html = renderTemplate(template, {
      name,
      resetUrl,
      year: new Date().getFullYear(),
      logoUrl:
        process.env.LOGO_URL ||
        "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
    });

    return await sendTransactionalMail(
      email,
      "Reset your Taja.Shop password",
      html,
    );
  } catch (error) {
    console.error("Send password reset email error:", error);
    throw error;
  }
}

/**
 * Send a broadcast / platform update email to a single recipient.
 * Used by admin to send bulk messages (platform updates, announcements).
 */
export async function sendBroadcastEmail(
  email: string,
  subject: string,
  htmlMessage: string,
  recipientName?: string,
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Broadcast email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const logoUrl =
      process.env.LOGO_URL ||
      "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png";
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <img src="${logoUrl}" alt="Taja.Shop" style="max-width:180px;height:auto;margin-bottom:24px;" />
        <div style="color:#333;line-height:1.6;">${htmlMessage}</div>
        <p style="margin-top:32px;font-size:12px;color:#888;">© ${new Date().getFullYear()} Taja.Shop. You received this because you are registered on our platform.</p>
      </div>
    `;

    return await sendTransactionalMail(email, subject, html);
  } catch (error) {
    console.error("Send broadcast email error:", error);
    throw error;
  }
}

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>,
  subtotal: number,
  shipping: number,
  discount: number,
  total: number,
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    phone: string;
  },
  orderId: string,
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Order confirmation email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXTAUTH_URL ||
      "https://tajaapp.shop";
    const orderUrl = `${baseUrl}/dashboard/orders/${orderId}`;

    const template = loadTemplate("order-confirmation");
    const html = renderTemplate(template, {
      customerName,
      orderNumber,
      items,
      subtotal,
      shipping,
      discount,
      total,
      shippingAddress,
      orderUrl,
      year: new Date().getFullYear(),
      logoUrl:
        process.env.LOGO_URL ||
        "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
    });

    return await sendTransactionalMail(
      email,
      `Order Confirmed - #${orderNumber}`,
      html,
    );
  } catch (error) {
    console.error("Send order confirmation email error:", error);
    throw error;
  }
}

/**
 * Send order shipped email with tracking information
 */
export async function sendOrderShippedEmail(
  email: string,
  customerName: string,
  orderNumber: string,
  trackingNumber: string,
  provider: "gokada" | "kwik",
  estimatedDelivery: string,
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>,
  shippingAddress: {
    city: string;
    state: string;
  },
  orderId: string,
  driver?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    rating?: number;
  },
) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Order shipped email skipped.");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXTAUTH_URL ||
      "https://tajaapp.shop";
    const orderUrl = `${baseUrl}/dashboard/orders/${orderId}`;
    const trackingUrl = `${baseUrl}/track/${trackingNumber}`;

    const template = loadTemplate("order-shipped");
    const html = renderTemplate(template, {
      customerName,
      orderNumber,
      trackingNumber,
      provider,
      estimatedDelivery,
      items,
      shippingAddress,
      driver,
      orderUrl,
      trackingUrl,
      year: new Date().getFullYear(),
      logoUrl:
        process.env.LOGO_URL ||
        "https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png",
    });

    return await sendTransactionalMail(
      email,
      `Your Order is On Its Way! - #${orderNumber}`,
      html,
    );
  } catch (error) {
    console.error("Send order shipped email error:", error);
    throw error;
  }
}

/**
 * Support tickets: notify admins / assignee
 *
 * Env:
 * - Resend and/or SMTP (see `mail-delivery.ts`)
 * - EMAIL_FROM / RESEND_FROM (optional)
 * - ADMIN_EMAIL (optional single recipient override)
 * - FRONTEND_URL / NEXTAUTH_URL (optional for deep links)
 */
async function getAdminRecipients(): Promise<string[]> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) return [adminEmail];
  try {
    const { default: User } = await import("@/models/User");
    const { default: connectDB } = await import("@/lib/db");
    await connectDB();
    const admins = await User.find({ role: "admin" }).select("email").lean();
    return admins.map((a: any) => a.email).filter(Boolean);
  } catch (e) {
    console.error("Failed to resolve admin recipients:", e);
    return [];
  }
}

function supportTicketLink(ticketId: string) {
  const baseUrl =
    process.env.FRONTEND_URL ||
    process.env.NEXTAUTH_URL ||
    "https://tajaapp.shop";
  return `${baseUrl}/admin/support/tickets/${ticketId}`;
}

export async function sendSupportTicketCreatedEmail(params: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  category?: string;
  priority?: string;
  requesterName?: string;
  requesterEmail?: string;
  assignedToEmail?: string | null;
}) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Support ticket email skipped.");
    return { success: false, error: "Email service not configured" };
  }

  const to = params.assignedToEmail
    ? [params.assignedToEmail]
    : await getAdminRecipients();

  if (!to.length) {
    console.warn("No admin recipients found for support ticket notification.");
    return { success: false, error: "No recipients" };
  }

  const url = supportTicketLink(params.ticketId);
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; background:#f5f5f7; padding:32px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;border:1px solid #edf0f4;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#10b981;font-weight:800;">New Support Ticket</div>
            <div style="font-size:18px;font-weight:900;color:#0f172a;margin-top:6px;">#${params.ticketNumber} — ${params.subject}</div>
          </div>
          <a href="${url}" style="background:#0f172a;color:white;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:800;text-decoration:none;">Open in Admin</a>
        </div>
        <div style="font-size:13px;color:#334155;line-height:1.6;">
          <p style="margin:0 0 10px;">
            <strong>Requester:</strong> ${params.requesterName || "—"} ${params.requesterEmail ? `(${params.requesterEmail})` : ""}
          </p>
          <p style="margin:0 0 10px;"><strong>Category:</strong> ${params.category || "general"} &nbsp; • &nbsp; <strong>Priority:</strong> ${params.priority || "medium"}</p>
        </div>
        <p style="margin-top:18px;font-size:12px;color:#64748b;">Taja.Shop • ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;

  const r = await deliverHtmlMail({
    to,
    subject: `[Taja.Shop] New ticket ${params.ticketNumber}: ${params.subject}`,
    html,
  });
  if (!r.ok) {
    console.error("Mail error (support ticket created):", r.error);
    return { success: false, error: r.error };
  }
  return { success: true, data: r };
}

export async function sendSupportTicketNewMessageEmail(params: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  messagePreview: string;
  senderName?: string;
  senderEmail?: string;
  assignedToEmail?: string | null;
}) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Support message email skipped.");
    return { success: false, error: "Email service not configured" };
  }

  const to = params.assignedToEmail
    ? [params.assignedToEmail]
    : await getAdminRecipients();

  if (!to.length) {
    console.warn("No admin recipients found for support message notification.");
    return { success: false, error: "No recipients" };
  }

  const url = supportTicketLink(params.ticketId);
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; background:#f5f5f7; padding:32px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;border:1px solid #edf0f4;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#f59e0b;font-weight:800;">New Customer Message</div>
        <div style="font-size:18px;font-weight:900;color:#0f172a;margin-top:6px;">#${params.ticketNumber} — ${params.subject}</div>
        <p style="margin:12px 0 0;color:#334155;font-size:13px;">
          <strong>From:</strong> ${params.senderName || "—"} ${params.senderEmail ? `(${params.senderEmail})` : ""}
        </p>
        <div style="margin-top:14px;background:#0f172a0a;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
          <div style="color:#0f172a;font-size:13px;white-space:pre-wrap;line-height:1.55;">
            ${params.messagePreview}
          </div>
        </div>
        <div style="margin-top:16px;">
          <a href="${url}" style="background:#0f172a;color:white;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:800;text-decoration:none;">Reply in Admin</a>
        </div>
        <p style="margin-top:18px;font-size:12px;color:#64748b;">Taja.Shop • ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;

  const r = await deliverHtmlMail({
    to,
    subject: `[Taja.Shop] New message on ${params.ticketNumber}`,
    html,
  });
  if (!r.ok) {
    console.error("Mail error (support message):", r.error);
    return { success: false, error: r.error };
  }
  return { success: true, data: r };
}

export async function sendSupportTicketAssignedEmail(params: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  assigneeEmail: string;
  assigneeName?: string;
  assignedByName?: string;
}) {
  if (!isMailConfigured()) {
    console.warn("No mail transport (Resend/SMTP). Support assignment email skipped.");
    return { success: false, error: "Email service not configured" };
  }

  const url = supportTicketLink(params.ticketId);
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; background:#f5f5f7; padding:32px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;border:1px solid #edf0f4;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#10b981;font-weight:800;">Ticket Assigned</div>
        <div style="font-size:18px;font-weight:900;color:#0f172a;margin-top:6px;">#${params.ticketNumber} — ${params.subject}</div>
        <p style="margin:12px 0 0;color:#334155;font-size:13px;">
          Hi ${params.assigneeName || "there"}, this ticket has been assigned to you${params.assignedByName ? ` by ${params.assignedByName}` : ""}.
        </p>
        <div style="margin-top:16px;">
          <a href="${url}" style="background:#0f172a;color:white;padding:10px 14px;border-radius:999px;font-size:12px;font-weight:800;text-decoration:none;">Open ticket</a>
        </div>
        <p style="margin-top:18px;font-size:12px;color:#64748b;">Taja.Shop • ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;

  const r = await deliverHtmlMail({
    to: params.assigneeEmail,
    subject: `[Taja.Shop] Assigned: ${params.ticketNumber}`,
    html,
  });
  if (!r.ok) {
    console.error("Mail error (support assignment):", r.error);
    return { success: false, error: r.error };
  }
  return { success: true, data: r };
}
