import { getCardImageUrl, getLqipImageUrl, type ImageVariant } from "./cdnImage";

const prefetched = new Set<string>();
const MAX_PREFETCH = 64;

function capPrefetch() {
  if (prefetched.size <= MAX_PREFETCH) return;
  const drop = prefetched.size - MAX_PREFETCH;
  const iter = prefetched.values();
  for (let i = 0; i < drop; i++) {
    const next = iter.next();
    if (!next.done) prefetched.delete(next.value);
  }
}

function resolvePrefetchUrl(url: string, variant: ImageVariant): string {
  if (variant === "lqip") return getLqipImageUrl(url);
  return getCardImageUrl(url);
}

/** Warm browser cache for product card images (deduped, CDN-sized). */
export function prefetchImageUrl(
  url: string | null | undefined,
  variant: ImageVariant = "card"
): void {
  if (typeof window === "undefined" || !url) return;
  const resolved = resolvePrefetchUrl(url, variant);
  if (!resolved || prefetched.has(resolved)) return;
  prefetched.add(resolved);
  capPrefetch();
  const img = new window.Image();
  img.decoding = "async";
  img.fetchPriority = variant === "lqip" ? "low" : "low";
  img.src = resolved;
}

export function prefetchImageUrls(
  urls: Array<string | null | undefined>,
  variant: ImageVariant = "card"
): void {
  urls.forEach((u) => prefetchImageUrl(u, variant));
}

/** Hint the browser to fetch video metadata before hover/play. */
export function prefetchVideoMetadata(url: string | null | undefined): void {
  if (typeof window === "undefined" || !url || prefetched.has(`video:${url}`)) return;
  prefetched.add(`video:${url}`);
  capPrefetch();
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  video.load();
}

export function prefetchProductCardMedia(
  items: Array<{ type: "image" | "video"; src: string; poster?: string }>,
  limit = 4
): void {
  items.slice(0, limit).forEach((item) => {
    if (item.type === "image") {
      prefetchImageUrl(item.src, "lqip");
      prefetchImageUrl(item.src, "card");
    } else {
      const poster = item.poster || item.src;
      prefetchImageUrl(poster, "lqip");
      prefetchImageUrl(poster, "card");
      prefetchVideoMetadata(item.src);
    }
  });
}

/** After marketplace feed loads, prefetch thumbs for the first visible rows. */
export function prefetchFeedProductThumbnails(
  products: Array<{ images?: string[]; videos?: unknown }>,
  count = 20
): void {
  for (const product of products.slice(0, count)) {
    const firstImage = Array.isArray(product.images)
      ? product.images.find((u) => typeof u === "string" && u.trim())
      : null;
    if (!firstImage) continue;
    prefetchImageUrl(firstImage, "lqip");
    prefetchImageUrl(firstImage, "card");
  }
}
