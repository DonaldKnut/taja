import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { requireRole } from '@/lib/middleware';
import { PRODUCT_IMAGE_PLACEHOLDER_URL } from '@/lib/brandAssets';

export const dynamic = 'force-dynamic';

const FALLBACK_PRODUCT_IMAGE = PRODUCT_IMAGE_PLACEHOLDER_URL;

const normalizeMediaUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  return null;
};

type ProductMediaDoc = {
  _id: unknown;
  images?: unknown[];
  videos?: unknown[];
};

// POST /api/admin/products/normalize-media
// Optional query: ?dryRun=true (default true)
export async function POST(request: NextRequest) {
  return requireRole(['admin'])(async () => {
    try {
      await connectDB();

      const dryRun = request.nextUrl.searchParams.get('dryRun') !== 'false';
      const products = (await Product.find({}, { _id: 1, images: 1, videos: 1 }).lean()) as ProductMediaDoc[];

      const updates: Array<{
        updateOne: {
          filter: { _id: unknown };
          update: { $set: { images: string[]; videos: Array<{ url: string; type: 'video' }> } };
        };
      }> = [];

      let scanned = 0;
      let changed = 0;
      let removedBadImages = 0;
      let removedBadVideos = 0;
      let fallbackApplied = 0;

      for (const product of products) {
        scanned += 1;
        const originalImages = Array.isArray(product.images) ? product.images : [];
        const originalVideos = Array.isArray(product.videos) ? product.videos : [];

        const normalizedImages = originalImages
          .map((img) => normalizeMediaUrl(img))
          .filter((img): img is string => Boolean(img))
          .slice(0, 10);

        const normalizedVideos = originalVideos
          .map((video) => {
            const rawUrl =
              typeof video === 'string'
                ? video
                : video && typeof video === 'object'
                ? (video as { url?: unknown }).url
                : undefined;
            const url = normalizeMediaUrl(rawUrl);
            return url ? { url, type: 'video' as const } : null;
          })
          .filter((video): video is { url: string; type: 'video' } => Boolean(video))
          .slice(0, 2);

        const badImageCount = Math.max(0, originalImages.length - normalizedImages.length);
        const badVideoCount = Math.max(0, originalVideos.length - normalizedVideos.length);

        let finalImages = normalizedImages;
        if (finalImages.length === 0) {
          finalImages = [FALLBACK_PRODUCT_IMAGE];
          fallbackApplied += 1;
        }

        const imagesChanged =
          finalImages.length !== originalImages.length ||
          finalImages.some((img, i) => img !== originalImages[i]);
        const videosChanged =
          normalizedVideos.length !== originalVideos.length ||
          normalizedVideos.some((video, i) => {
            const currentUrl =
              typeof originalVideos[i] === 'string'
                ? originalVideos[i]
                : originalVideos[i] && typeof originalVideos[i] === 'object'
                ? (originalVideos[i] as { url?: unknown }).url
                : undefined;
            return video.url !== currentUrl;
          });

        if (!imagesChanged && !videosChanged) continue;

        changed += 1;
        removedBadImages += badImageCount;
        removedBadVideos += badVideoCount;

        updates.push({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                images: finalImages,
                videos: normalizedVideos,
              },
            },
          },
        });
      }

      if (!dryRun && updates.length > 0) {
        await Product.bulkWrite(updates, { ordered: false });
      }

      return NextResponse.json({
        success: true,
        message: dryRun
          ? 'Dry run complete. No products were updated.'
          : 'Product media normalization complete.',
        data: {
          dryRun,
          scanned,
          changed,
          removedBadImages,
          removedBadVideos,
          fallbackApplied,
        },
      });
    } catch (error: any) {
      console.error('Normalize product media error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to normalize product media' },
        { status: 500 }
      );
    }
  })(request);
}

