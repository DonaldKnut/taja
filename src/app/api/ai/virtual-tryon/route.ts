import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/ai/virtual-tryon - Virtual try-on analysis
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      // Lazy-load heavy/server-only deps to avoid build-time timeouts.
      const [
        { analyzeVirtualTryOn, analyzeProductInContext },
        { optimizeImage, overlayProductOnUser, detectBodyLandmarks },
        { uploadBufferToR2 },
        { default: connectDB },
        { default: Product },
        { default: sharp },
      ] = await Promise.all([
        import('@/lib/gemini'),
        import('@/lib/imageProcessing'),
        import('@/lib/r2'),
        import('@/lib/db'),
        import('@/models/Product'),
        import('sharp'),
      ]);

      const formData = await request.formData();
      const productId = formData.get('productId') as string;
      const userPhoto = formData.get('userPhoto') as File;
      const mode = formData.get('mode') as string || 'analysis'; // 'analysis' or 'overlay'
      const context = formData.get('context') as string || 'casual';

      if (!productId || !userPhoto) {
        return NextResponse.json(
          { success: false, message: 'Product ID and user photo are required' },
          { status: 400 }
        );
      }

      await connectDB();

      // Get product
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: 'Product not found' },
          { status: 404 }
        );
      }

      // Validate image
      if (!userPhoto.type.startsWith('image/')) {
        return NextResponse.json(
          { success: false, message: 'User photo must be an image' },
          { status: 400 }
        );
      }

      // Convert files to buffers
      const userPhotoBuffer = Buffer.from(await userPhoto.arrayBuffer());
      const productImageUrl = product.images[0];

      if (!productImageUrl) {
        return NextResponse.json(
          { success: false, message: 'Product has no images' },
          { status: 400 }
        );
      }

      // Fetch product image
      const productImageResponse = await fetch(productImageUrl);
      const productImageBuffer = Buffer.from(await productImageResponse.arrayBuffer());

      // Optimize images
      const optimizedUserPhoto = await optimizeImage(userPhotoBuffer);
      const optimizedProductImage = await optimizeImage(productImageBuffer);

      if (mode === 'overlay') {
        // Generate overlay image
        const landmarks = await detectBodyLandmarks(optimizedUserPhoto);

        // Determine position based on product category
        let position = { x: 0, y: 0, width: 0, height: 0 };
        const metadata = await sharp(optimizedUserPhoto).metadata();
        const userWidth = metadata.width || 0;
        const userHeight = metadata.height || 0;

        // Simple positioning logic (can be improved with ML)
        if (product.category?.toString().toLowerCase().includes('shirt') ||
          product.category?.toString().toLowerCase().includes('top')) {
          position = {
            x: Math.floor(userWidth * 0.2),
            y: landmarks.shoulders?.y || Math.floor(userHeight * 0.3),
            width: Math.floor(userWidth * 0.6),
            height: Math.floor(userHeight * 0.4),
          };
        } else if (product.category?.toString().toLowerCase().includes('pant') ||
          product.category?.toString().toLowerCase().includes('bottom')) {
          position = {
            x: Math.floor(userWidth * 0.25),
            y: landmarks.waist?.y || Math.floor(userHeight * 0.5),
            width: Math.floor(userWidth * 0.5),
            height: Math.floor(userHeight * 0.5),
          };
        } else {
          // Default center position
          position = {
            x: Math.floor(userWidth * 0.3),
            y: Math.floor(userHeight * 0.3),
            width: Math.floor(userWidth * 0.4),
            height: Math.floor(userHeight * 0.4),
          };
        }

        const overlayImage = await overlayProductOnUser(
          optimizedUserPhoto,
          optimizedProductImage,
          position
        );

        // Upload overlay result to R2
        const { url: overlayUrl } = await uploadBufferToR2({
          buffer: overlayImage,
          originalName: `tryon-${productId}-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
          folder: 'virtual-tryon',
        });

        // Also get AI analysis
        const analysis = await analyzeVirtualTryOn(
          optimizedProductImage,
          optimizedUserPhoto,
          {
            title: product.title,
            category: product.category?.toString() || 'unknown',
            color: product.specifications?.get('color') || '',
            type: 'clothing', // Can be determined from category
          }
        );

        return NextResponse.json({
          success: true,
          data: {
            overlayImage: overlayUrl,
            analysis,
            product: {
              _id: product._id,
              title: product.title,
              price: product.price,
            },
          },
        });
      } else {
        // Analysis mode only
        const analysis = await analyzeVirtualTryOn(
          optimizedProductImage,
          optimizedUserPhoto,
          {
            title: product.title,
            category: product.category?.toString() || 'unknown',
            color: product.specifications?.get('color') || '',
            type: 'clothing',
          }
        );

        // Also get context analysis
        const contextAnalysis = await analyzeProductInContext(
          optimizedProductImage,
          context as any
        );

        return NextResponse.json({
          success: true,
          data: {
            analysis,
            contextAnalysis,
            product: {
              _id: product._id,
              title: product.title,
              price: product.price,
              images: product.images,
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Virtual try-on error:', error);

      // Check if it's a Gemini API key error
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
        { success: false, message: error.message || 'Failed to process virtual try-on' },
        { status: 500 }
      );
    }
  })(request);
}

