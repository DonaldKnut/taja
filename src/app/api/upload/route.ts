import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/middleware';
import { extractAccessTokenFromRequest } from '@/lib/auth-request-token';
import { uploadBufferToR2 } from '@/lib/r2';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// POST /api/upload - Upload file (auth required except type=logistics-kyc for onboarding uploads)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const isProductVideo = type === 'product-video';
    const isLogisticsKyc = type === 'logistics-kyc';
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = isProductVideo ? allowedVideoTypes : allowedImageTypes;

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

    if (isLogisticsKyc && isProductVideo) {
      return NextResponse.json(
        { success: false, message: 'Invalid upload type for logistics KYC' },
        { status: 400 }
      );
    }

    const maxSize = isProductVideo ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: isProductVideo
            ? 'Video size exceeds 20MB limit'
            : 'File size exceeds 10MB limit',
        },
        { status: 400 }
      );
    }

    const tokenPresent = Boolean(extractAccessTokenFromRequest(request));
    const { user, error } = await authenticate(request);

    if (!isLogisticsKyc) {
      if (!user || error) {
        return NextResponse.json(
          { success: false, message: error || 'Authentication required' },
          { status: 401 }
        );
      }
    } else if (tokenPresent && (!user || error)) {
      return NextResponse.json(
        { success: false, message: error || 'Unauthorized: invalid token' },
        { status: 401 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let folder = 'general';
    if (type === 'product') folder = 'products';
    else if (type === 'product-video') folder = 'products/videos';
    else if (type === 'shop' || type === 'logo' || type === 'banner') folder = 'shops';
    else if (type === 'avatar' || type === 'cover') folder = 'avatars';
    else if (type === 'journal' || type === 'blog') folder = 'journal';
    else if (type === 'logistics-kyc') folder = 'logistics/kyc';

    const { url, key } = await uploadBufferToR2({
      buffer,
      originalName: file.name,
      contentType: file.type,
      folder,
    });

    await writeAuditLog({
      request,
      actorUserId: user?.userId,
      actorRole: user?.role,
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
        anonymousLogisticsKyc: isLogisticsKyc && !user,
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
}








