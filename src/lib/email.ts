import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email configuration - ready for plug-and-play with Resend
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Load email templates
const loadTemplate = (templateName: string): string => {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.html`);
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load email template: ${templateName}`, error);
    return '';
  }
};

// Render template with variables (simple string replacement)
const renderTemplate = (template: string, variables: Record<string, any>): string => {
  let rendered = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`<%= ${key} %>`, 'g');
    const value = variables[key] || '';
    rendered = rendered.replace(regex, String(value));
  });
  // Handle conditional logo rendering
  if (variables.logoUrl) {
    rendered = rendered.replace(
      /<% if \(typeof logoUrl !== 'undefined' && logoUrl\) \{ %>[\s\S]*?<% \} else \{ %>[\s\S]*?<% \} %>/g,
      `<img src="${variables.logoUrl}" alt="Taja.Shop Logo" style="max-width:200px;height:auto;margin-bottom:12px;" />`
    );
  } else {
    rendered = rendered.replace(
      /<% if \(typeof logoUrl !== 'undefined' && logoUrl\) \{ %>[\s\S]*?<% \} else \{ %>/g,
      ''
    ).replace(/<% \} %>/g, '');
  }
  return rendered;
};

/**
 * Send email verification code
 * Requires RESEND_API_KEY to be set in environment variables
 * @param email - Recipient email address
 * @param name - Recipient name
 * @param code - 6-digit verification code
 * @returns Success status and data or error
 */
export async function sendVerificationEmail(email: string, name: string, code: string) {
  if (!resend) {
    console.warn('⚠️  RESEND_API_KEY not set. Email verification skipped.');
    console.warn(`   Verification code for ${email}: ${code}`);
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const template = loadTemplate('verification');
    const html = renderTemplate(template, {
      name,
      code,
      year: new Date().getFullYear(),
      logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Verify your Taja.Shop email',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Send verification email error:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Welcome email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const template = loadTemplate('welcome');
    const dashboardUrl = `${process.env.NEXTAUTH_URL || 'https://tajaapp.shop'}/dashboard`;
    const html = renderTemplate(template, {
      name,
      dashboardUrl,
      year: new Date().getFullYear(),
      logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Welcome to Taja.Shop!',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Send welcome email error:', error);
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
  shopName?: string
) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Seller-approved email skipped.');
    return { success: false, error: 'Email service not configured' };
  }

  const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
  const dashboardUrl = `${baseUrl}/seller/dashboard`;

  const safeName = name || 'Seller';
  const safeShopName = shopName || 'your shop';

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f7; padding:32px 0;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px 28px;border:1px solid #edf0f4;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="${process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png'}" alt="Taja.Shop" style="max-width:180px;height:auto;margin-bottom:12px;" />
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
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Taja.Shop seller account is live',
      html,
    });

    if (error) {
      console.error('Resend error (seller approved):', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (e) {
    console.error('Send seller approved email error:', e);
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
  businessName?: string
) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Admin KYC-submitted email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
  const reviewUrl = `${baseUrl}/admin/kyc`;

  const template = loadTemplate('admin-kyc');
  const html = renderTemplate(template, {
    submitterName,
    submitterEmail,
    businessName: businessName || '—',
    reviewUrl,
    year: new Date().getFullYear(),
    logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `[Taja.Shop] New KYC submission: ${submitterName}`,
      html,
    });
    if (error) {
      console.error('Resend error (admin KYC submitted):', error);
      return { success: false, error };
    }
    return { success: true, data };
  }

  try {
    const { default: User } = await import('@/models/User');
    const { default: connectDB } = await import('@/lib/db');
    await connectDB();
    const admins = await User.find({ role: 'admin' }).select('email').lean();
    for (const admin of admins) {
      if (admin.email) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: admin.email,
          subject: `[Taja.Shop] New KYC submission: ${submitterName}`,
          html,
        });
      }
    }
    return { success: true, data: null };
  } catch (e) {
    console.error('Send admin KYC-submitted email error:', e);
    return { success: false, error: e };
  }
}

/**
 * Send email to admin(s) when a new shop is registered.
 * Uses ADMIN_EMAIL if set (single recipient), otherwise sends to all users with role admin.
 */
export async function sendAdminNewShopEmail(shopName: string, ownerName: string, ownerEmail: string) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Admin new-shop email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
  const reviewUrl = `${baseUrl}/admin/kyc`;

  const template = loadTemplate('admin-new-shop');
  const html = renderTemplate(template, {
    shopName,
    ownerName,
    ownerEmail,
    reviewUrl,
    year: new Date().getFullYear(),
    logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `[Taja.Shop] New shop: ${shopName} – under review`,
      html,
    });
    if (error) {
      console.error('Resend error (admin new shop):', error);
      return { success: false, error };
    }
    return { success: true, data };
  }

  // No ADMIN_EMAIL: fetch admin emails from DB and send to each
  try {
    const { default: User } = await import('@/models/User');
    const { default: connectDB } = await import('@/lib/db');
    await connectDB();
    const admins = await User.find({ role: 'admin' }).select('email').lean();
    for (const admin of admins) {
      if (admin.email) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: admin.email,
          subject: `[Taja.Shop] New shop: ${shopName} – under review`,
          html,
        });
      }
    }
    return { success: true, data: null };
  } catch (e) {
    console.error('Send admin new-shop email error:', e);
    return { success: false, error: e };
  }
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Password reset email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL || 'https://tajaapp.shop'}/reset-password/${resetToken}`;
    const template = loadTemplate('password-reset');
    const html = renderTemplate(template, {
      name,
      resetUrl,
      year: new Date().getFullYear(),
      logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Reset your Taja.Shop password',
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Send password reset email error:', error);
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
  recipientName?: string
) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Broadcast email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const logoUrl = process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png';
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <img src="${logoUrl}" alt="Taja.Shop" style="max-width:180px;height:auto;margin-bottom:24px;" />
        <div style="color:#333;line-height:1.6;">${htmlMessage}</div>
        <p style="margin-top:32px;font-size:12px;color:#888;">© ${new Date().getFullYear()} Taja.Shop. You received this because you are registered on our platform.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error('Resend broadcast error:', error);
      throw error;
    }
    return { success: true, data };
  } catch (error) {
    console.error('Send broadcast email error:', error);
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
  orderId: string
) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Order confirmation email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
    const orderUrl = `${baseUrl}/dashboard/orders/${orderId}`;
    
    const template = loadTemplate('order-confirmation');
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
      logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Order Confirmed - #${orderNumber}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Send order confirmation email error:', error);
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
  provider: 'gokada' | 'kwik',
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
  driver?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    rating?: number;
  },
  orderId: string
) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Order shipped email skipped.');
    return { success: false, error: 'Email service not configured' };
  }
  try {
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
    const orderUrl = `${baseUrl}/dashboard/orders/${orderId}`;
    const trackingUrl = `${baseUrl}/track/${trackingNumber}`;
    
    const template = loadTemplate('order-shipped');
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
      logoUrl: process.env.LOGO_URL || 'https://res.cloudinary.com/db2fcni0k/image/upload/v1771782341/taja_y3vftg.png',
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Your Order is On Its Way! - #${orderNumber}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Send order shipped email error:', error);
    throw error;
  }
}

