import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/ai/style-recommendations - Get AI-powered style recommendations
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      // Lazy-load heavy/server-only deps to avoid build-time timeouts.
      const [{ getStyleRecommendations }, { optimizeImage }, { default: connectDB }, { default: Product }] =
        await Promise.all([
          import('@/lib/gemini'),
          import('@/lib/imageProcessing'),
          import('@/lib/db'),
          import('@/models/Product'),
        ]);

      const formData = await request.formData();
      const userPhoto = formData.get('userPhoto') as File;
      const preferences = {
        style: formData.get('style') as string || undefined,
        occasion: formData.get('occasion') as string || undefined,
        budget: formData.get('budget') as string || undefined,
        colors: formData.get('colors')?.toString().split(',') || undefined,
      };

      if (!userPhoto) {
        return NextResponse.json(
          { success: false, message: 'User photo is required' },
          { status: 400 }
        );
      }

      // Validate image
      if (!userPhoto.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, message: 'User photo must be an image' },
          { status: 400 }
        );
      }

      // Convert to buffer and optimize
      const userPhotoBuffer = Buffer.from(await userPhoto.arrayBuffer());
      const optimizedPhoto = await optimizeImage(userPhotoBuffer);

      // Get AI recommendations
      const recommendations = await getStyleRecommendations(optimizedPhoto, preferences);

      // Find matching products from database
      await connectDB();
      const matchingProducts = await Product.find({
        status: 'active',
        // Can add more filters based on recommendations
      })
        .limit(10)
        .select('title price images category')
        .lean();

      return NextResponse.json({
        success: true,
        data: {
          styleProfile: recommendations.styleProfile,
          recommendations: recommendations.recommendations,
          matchingProducts,
        },
      });
    } catch (error: any) {
      console.error('Style recommendations error:', error);

      if (error.message?.includes('Gemini API key')) {
        return NextResponse.json(
          {
            success: false,
            message: 'AI service not configured. Please set GEMINI_API_KEY in environment variables.',
            error: 'MISSING_API_KEY'
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { success: false, message: error.message || 'Failed to get style recommendations' },
        { status: 500 }
      );
    }
  })(request);
}








