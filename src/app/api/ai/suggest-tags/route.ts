import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { suggestProductTags } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/suggest-tags
 * Suggest AI product tags
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { title, description, category, count = 10 } = body;

      if (!title?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Product title is required' },
          { status: 400 }
        );
      }

      const tags = await suggestProductTags(
        title,
        description,
        category,
        count
      );

      return NextResponse.json({
        success: true,
        tags,
      });
    } catch (error: any) {
      console.error('Suggest tags error:', error);

      if (error.message?.includes('Gemini API key')) {
        return NextResponse.json(
          {
            success: false,
            message: 'AI service not configured. Please set GEMINI_API_KEY.',
            error: 'MISSING_API_KEY'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, message: error.message || 'Failed to suggest tags' },
        { status: 500 }
      );
    }
  })(request);
}
