import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { uploadBufferToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// POST /api/upload - Upload file
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string; // 'product', 'shop', 'avatar', 'general'

      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: 'Invalid file type. Only images are allowed.' },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, message: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine folder based on type
      let folder = 'general';
      if (type === 'product') folder = 'products';
      else if (type === 'shop' || type === 'logo' || type === 'banner') folder = 'shops';
      else if (type === 'avatar' || type === 'cover') folder = 'avatars';
      else if (type === 'journal' || type === 'blog') folder = 'journal';

      // Upload to R2
      const { url, key } = await uploadBufferToR2({
        buffer,
        originalName: file.name,
        contentType: file.type,
        folder,
      });

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url,
          key,
          filename: file.name,
          size: file.size,
          type: file.type,
        },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to upload file' },
        { status: 500 }
      );
    }
  })(request);
}








