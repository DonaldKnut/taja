import { normalizeMediaUrl } from "./normalizeMediaUrl";
import type { Product } from "@/types";

export type ProductMediaItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
};

export function buildProductMediaItems(
  product: Product,
  fallbackImage: string
): ProductMediaItem[] {
  const normalizedImages = Array.isArray(product?.images)
    ? product.images
        .map((src) => normalizeMediaUrl(src))
        .filter((src): src is string => Boolean(src))
    : [];
  const images = normalizedImages.length ? normalizedImages : [fallbackImage];

  const videoItems = (() => {
    const raw = (product as { videos?: unknown }).videos;
    if (!Array.isArray(raw)) return [] as Array<{ src: string; poster?: string }>;
    return raw
      .map((v: unknown) => {
        if (typeof v === "string") {
          const src = normalizeMediaUrl(v);
          return src ? { src } : null;
        }
        if (!v || typeof v !== "object") return null;
        const obj = v as Record<string, unknown>;
        const src = normalizeMediaUrl(obj.url);
        if (!src) return null;
        const poster =
          normalizeMediaUrl(obj.poster) ||
          normalizeMediaUrl(obj.thumbnail) ||
          normalizeMediaUrl(obj.previewImage) ||
          undefined;
        return { src, poster };
      })
      .filter((item): item is { src: string; poster?: string } => Boolean(item))
      .slice(0, 2);
  })();

  return [
    ...videoItems.map((item) => ({
      type: "video" as const,
      src: item.src,
      poster: item.poster,
    })),
    ...images.map((src) => ({ type: "image" as const, src, poster: undefined })),
  ];
}
