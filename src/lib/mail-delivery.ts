/**
 * Transactional email delivery: Resend (API) and/or SMTP (Nodemailer).
 *
 * EMAIL_TRANSPORT:
 * - auto (default): try Resend first if RESEND_API_KEY is set; on failure try SMTP if configured.
 *                   If no Resend key, use SMTP only when configured.
 * - resend: Resend only (no SMTP fallback).
 * - smtp: SMTP only.
 * - smtp_first: try SMTP first, then Resend on failure.
 *
 * SMTP: SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_SECURE=true for 465.
 * EMAIL_FROM must be a sender your SMTP provider allows (often matches SMTP_USER for Gmail).
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  process.env.RESEND_FROM ||
  "onboarding@resend.dev";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function hasResend(): boolean {
  return Boolean(resendClient && process.env.RESEND_API_KEY);
}

function hasSmtp(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (smtpTransporter) return smtpTransporter;
  const host = process.env.SMTP_HOST!.trim();
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465;

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth:
      user !== undefined && user !== ""
        ? { user, pass }
        : undefined,
  });
  return smtpTransporter;
}

async function sendViaResend(params: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (!resendClient) throw new Error("Resend not configured");
  const { data, error } = await resendClient.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  if (error) throw error;
  if (!data) throw new Error("Resend returned no data");
}

async function sendViaSmtp(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const transport = getSmtpTransporter();
  await transport.sendMail({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

export type DeliverHtmlMailResult =
  | { ok: true; via: "resend" | "smtp" }
  | { ok: false; error: string };

/** True if at least one outbound path is configured. */
export function isMailConfigured(): boolean {
  return hasResend() || hasSmtp();
}

/**
 * Send one HTML email using configured transport(s).
 */
export async function deliverHtmlMail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<DeliverHtmlMailResult> {
  const mode = (process.env.EMAIL_TRANSPORT || "auto").toLowerCase();
  const errors: string[] = [];

  const tryResend = async (): Promise<boolean> => {
    if (!hasResend()) return false;
    try {
      await sendViaResend(params);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Resend: ${msg}`);
      console.warn("[mail-delivery] Resend error:", e);
      return false;
    }
  };

  const trySmtp = async (): Promise<boolean> => {
    if (!hasSmtp()) return false;
    try {
      await sendViaSmtp(params);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`SMTP: ${msg}`);
      console.warn("[mail-delivery] SMTP error:", e);
      return false;
    }
  };

  if (mode === "smtp") {
    if (await trySmtp()) return { ok: true, via: "smtp" };
    return {
      ok: false,
      error: errors.join("; ") || "SMTP not configured or failed",
    };
  }

  if (mode === "resend") {
    if (await tryResend()) return { ok: true, via: "resend" };
    return {
      ok: false,
      error: errors.join("; ") || "Resend not configured or failed",
    };
  }

  if (mode === "smtp_first") {
    if (await trySmtp()) return { ok: true, via: "smtp" };
    if (await tryResend()) return { ok: true, via: "resend" };
    return {
      ok: false,
      error:
        errors.join("; ") || "No working email transport (SMTP + Resend failed)",
    };
  }

  // auto: Resend first, then SMTP fallback
  if (await tryResend()) return { ok: true, via: "resend" };
  if (await trySmtp()) {
    console.info("[mail-delivery] Delivered via SMTP (Resend unavailable or failed)");
    return { ok: true, via: "smtp" };
  }

  return {
    ok: false,
    error:
      errors.join("; ") ||
      "No email transport configured. Set RESEND_API_KEY and/or SMTP_HOST (+ SMTP_USER/SMTP_PASS as required).",
  };
}
