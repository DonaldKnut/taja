import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { uploadBufferToR2 } from '@/lib/r2';
import { writeAuditLog } from '@/lib/audit';

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

      const isProductVideo = type === 'product-video';
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      const allowedTypes = isProductVideo ? allowedVideoTypes : allowedImageTypes;

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: isProductVideo
              ? 'Invalid video type. Allowed: MP4, WEBM, MOV.'
              : 'Invalid file type. Only images are allowed.',
          },
          { status: 400 }
        );
      }

      // Validate file size (images: 10MB, product videos: 80MB)
      const maxSize = isProductVideo ? 80 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            message: isProductVideo
              ? 'Video size exceeds 80MB limit'
              : 'File size exceeds 10MB limit',
          },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine folder based on type
      let folder = 'general';
      if (type === 'product') folder = 'products';
      else if (type === 'product-video') folder = 'products/videos';
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

      await writeAuditLog({
        request,
        actorUserId: user.userId,
        actorRole: user.role,
        action: isProductVideo ? 'upload.product_video' : 'upload.file',
        entityType: isProductVideo ? 'product_video' : 'file',
        entityId: key,
        metadata: {
          type,
          folder,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          url,
        },
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








