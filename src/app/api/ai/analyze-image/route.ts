import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { analyzeProductImage } from '@/lib/ai/imageRecognition';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/analyze-image
 * Analyze product image with AI
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { imageUrl } = body;

      if (!imageUrl?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Image URL is required' },
          { status: 400 }
        );
      }

      // Fetch image from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { success: false, message: 'Failed to fetch image' },
          { status: 400 }
        );
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      const analysis = await analyzeProductImage(imageBuffer, contentType);

      return NextResponse.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error('Analyze image error:', error);

      if (error.message?.includes('Gemini API')) {
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
        { success: false, message: error.message || 'Failed to analyze image' },
        { status: 500 }
      );
    }
  })(request);
}
