/** Branded transactional email: logistics rider portal access (admin-triggered). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type RiderCredentialsEmailParams = {
  riderName: string;
  loginUrl: string;
  email: string;
  temporaryPassword: string;
  isPasswordRotation: boolean;
};

export function buildRiderCredentialsEmailHtml(p: RiderCredentialsEmailParams): string {
  const intro = p.isPasswordRotation
    ? "Your Taja rider portal password has been reset. Use the new temporary password below to sign in, then change your password from the rider dashboard."
    : "Your Taja rider portal access is ready. Use the credentials below to sign in at the rider portal, then change your password from the dashboard.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rider portal access</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 20px 50px -20px rgba(15,23,42,0.15);">
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#10b981 45%,#0f766e 100%);padding:28px 28px 24px;">
              <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Taja · Logistics</p>
              <h1 style="margin:10px 0 0;font-size:22px;font-weight:900;letter-spacing:-0.02em;color:#ffffff;line-height:1.2;">Your rider portal</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hi ${escapeHtml(p.riderName)},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">${intro}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Sign-in page</p>
                    <a href="${escapeHtml(p.loginUrl)}" style="font-size:14px;font-weight:700;color:#059669;word-break:break-all;">${escapeHtml(p.loginUrl)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 16px;">
                    <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Email</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;word-break:break-all;">${escapeHtml(p.email)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 18px;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Temporary password</p>
                    <p style="margin:0;padding:12px 14px;background:#fff;border:1px dashed #cbd5e1;border-radius:10px;font-size:18px;font-weight:800;letter-spacing:0.06em;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(p.temporaryPassword)}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="border-radius:999px;background:#059669;">
                    <a href="${escapeHtml(p.loginUrl)}" style="display:inline-block;padding:14px 28px;font-size:12px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Open rider portal</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#64748b;border-top:1px solid #f1f5f9;padding-top:20px;">
                For your security: sign in as soon as you can and set a new password you don’t use anywhere else. If you didn’t expect this email, contact Taja support — do not share this password.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">Sent by Taja operations. This message contains sensitive access details — treat it like a bank notification.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function buildRiderCredentialsEmailText(p: RiderCredentialsEmailParams): string {
  const lines = [
    `Hi ${p.riderName},`,
    "",
    p.isPasswordRotation
      ? "Your Taja rider portal password has been reset. Use the new temporary password below."
      : "Your Taja rider portal access is ready. Use the credentials below.",
    "",
    `Sign in: ${p.loginUrl}`,
    `Email: ${p.email}`,
    `Temporary password: ${p.temporaryPassword}`,
    "",
    "Sign in soon and change your password from the rider dashboard.",
    "",
    "If you did not expect this email, contact Taja support.",
  ];
  return lines.join("\n");
}
