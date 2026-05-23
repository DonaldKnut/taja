import { NextRequest, NextResponse } from 'next/server';
import { generateSimpleText } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/generate — simple Gemini completion (playground, empty states, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server.' },
        { status: 503 }
      );
    }

    const text = await generateSimpleText(prompt);

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (error: any) {
    console.error('[api/ai/generate]', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Generation failed',
      },
      { status: 500 }
    );
  }
}
