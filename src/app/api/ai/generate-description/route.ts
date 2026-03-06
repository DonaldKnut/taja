import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { generateProductDescription } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/generate-description
 * Generate AI product description
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { title, description, category } = body;

      if (!title?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Product title is required' },
          { status: 400 }
        );
      }

      const generatedDescription = await generateProductDescription(
        title,
        description,
        category
      );

      return NextResponse.json({
        success: true,
        description: generatedDescription,
      });
    } catch (error: any) {
      console.error('Generate description error:', error);

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
        { success: false, message: error.message || 'Failed to generate description' },
        { status: 500 }
      );
    }
  })(request);
}
