import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireRole } from '@/lib/middleware';
import { sendBroadcastEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/broadcast - Send bulk email to selected users (admin only).
 * Body: { emails: string[], subject: string, message: string }
 * message is plain text or HTML; will be wrapped in a simple layout.
 */
export async function POST(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      const body = await request.json();
      const { emails, subject, message } = body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json(
          { success: false, message: 'At least one email is required' },
          { status: 400 }
        );
      }
      if (!subject || typeof subject !== 'string' || !subject.trim()) {
        return NextResponse.json(
          { success: false, message: 'Subject is required' },
          { status: 400 }
        );
      }
      if (!message || typeof message !== 'string' || !message.trim()) {
        return NextResponse.json(
          { success: false, message: 'Message body is required' },
          { status: 400 }
        );
      }

      // Normalize: unique, valid email-like strings, max 500 per request
      const uniqueEmails = [...new Set(emails)]
        .filter((e) => typeof e === 'string' && e.includes('@'))
        .slice(0, 500);

      if (uniqueEmails.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No valid email addresses provided' },
          { status: 400 }
        );
      }

      // Convert plain text newlines to <p> or <br> for HTML
      const htmlMessage = message.includes('<') && message.includes('>')
        ? message
        : message.split('\n').map((line: string) => `<p style="margin:0 0 12px 0;">${escapeHtml(line) || '&nbsp;'}</p>`).join('');

      const results: { email: string; success: boolean; error?: string }[] = [];
      for (const email of uniqueEmails) {
        try {
          await sendBroadcastEmail(email, subject.trim(), htmlMessage);
          results.push({ email, success: true });
        } catch (err: any) {
          results.push({ email, success: false, error: err?.message || 'Send failed' });
        }
      }

      const sent = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);

      return NextResponse.json({
        success: true,
        message: `Sent to ${sent} of ${uniqueEmails.length} recipients${failed.length ? `. ${failed.length} failed.` : ''}`,
        data: {
          total: uniqueEmails.length,
          sent,
          failed: failed.length,
          failures: failed.slice(0, 10),
        },
      });
    } catch (error: any) {
      console.error('POST admin broadcast error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Broadcast failed' },
        { status: 500 }
      );
    }
  })(request);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c] || c);
}
