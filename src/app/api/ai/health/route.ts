import { NextRequest, NextResponse } from 'next/server';
import { generateSimpleText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/health — env check; optional live Gemini ping with ?live=1
 */
export async function GET(request: NextRequest) {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY?.trim());
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const live = request.nextUrl.searchParams.get('live') === '1';

  const r2 = {
    accountIdConfigured: Boolean(process.env.R2_ACCOUNT_ID?.trim()),
    bucketConfigured: Boolean(process.env.R2_BUCKET_NAME?.trim()),
    accessKeysConfigured: Boolean(
      process.env.R2_ACCESS_KEY_ID?.trim() && process.env.R2_SECRET_ACCESS_KEY?.trim()
    ),
    publicBaseUrlConfigured: Boolean(process.env.R2_PUBLIC_BASE_URL?.trim()),
  };

  const payload: Record<string, unknown> = {
    success: true,
    gemini: {
      configured: geminiConfigured,
      model,
    },
    r2: {
      ...r2,
      imageHint:
        r2.publicBaseUrlConfigured
          ? 'R2_PUBLIC_BASE_URL is set — use that host for public image URLs.'
          : 'Without R2_PUBLIC_BASE_URL, uploads may use r2.cloudflarestorage.com URLs that return 403 in the browser unless the bucket allows public reads. Prefer an r2.dev public URL or a custom domain in Cloudflare.',
    },
  };

  if (!live) {
    payload.liveTest = { skipped: true, tip: 'Add ?live=1 to send one short request to Gemini (uses API quota).' };
    return NextResponse.json(payload);
  }

  if (!geminiConfigured) {
    return NextResponse.json(
      { ...payload, liveTest: { ok: false, error: 'GEMINI_API_KEY not set' } },
      { status: 503 }
    );
  }

  try {
    const reply = await generateSimpleText('Reply with exactly: ok');
    payload.liveTest = { ok: true, replyPreview: reply.slice(0, 120) };
    return NextResponse.json(payload);
  } catch (e: any) {
    payload.liveTest = { ok: false, error: e?.message || 'Gemini request failed' };
    return NextResponse.json(payload, { status: 502 });
  }
}
