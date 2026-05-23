/**
 * CDN-aware image URLs — small card thumbs + tiny LQIP (Jiji / Jumia style).
 * Cloudinary: insert transforms after `/upload/`.
 */

export type ImageVariant = "lqip" | "card" | "poster" | "full";

const CLOUDINARY_RE = /res\.cloudinary\.com/i;

/** Card grid (~400px); eco quality keeps bytes low on mobile. */
const TRANSFORMS: Record<ImageVariant, string> = {
  lqip: "w_40,h_40,c_fill,q_20,e_blur:1000,f_auto",
  card: "w_480,h_480,c_fill,q_auto:eco,f_auto,dpr_auto",
  poster: "w_720,h_720,c_fill,q_auto:eco,f_auto",
  full: "q_auto:eco,f_auto,w_1200,c_limit",
};

function cloudinaryAlreadyTransformed(url: string): boolean {
  const part = url.split("/upload/")[1];
  if (!part) return false;
  const first = part.split("/")[0] ?? "";
  if (/^v\d+$/i.test(first)) return false;
  return first.includes(",") || /^w_\d+/i.test(first);
}

export function getOptimizedImageUrl(
  src: string | null | undefined,
  variant: ImageVariant = "card"
): string {
  if (!src || typeof src !== "string") return "";
  const trimmed = src.trim();
  if (!trimmed) return "";

  if (!CLOUDINARY_RE.test(trimmed) || !trimmed.includes("/upload/")) {
    return trimmed;
  }

  if (variant === "full" && cloudinaryAlreadyTransformed(trimmed)) {
    return trimmed;
  }

  if (cloudinaryAlreadyTransformed(trimmed)) {
    if (variant === "lqip") {
      return trimmed.replace(/\/upload\/[^/]+\//, `/upload/${TRANSFORMS.lqip}/`);
    }
    return trimmed;
  }

  return trimmed.replace("/upload/", `/upload/${TRANSFORMS[variant]}/`);
}

export function getCardImageUrl(src: string | null | undefined): string {
  return getOptimizedImageUrl(src, "card");
}

export function getLqipImageUrl(src: string | null | undefined): string {
  return getOptimizedImageUrl(src, "lqip");
}

export function getVideoPosterUrl(src: string | null | undefined): string {
  return getOptimizedImageUrl(src, "poster");
}

/** Hostnames to preconnect in layout for faster TLS + first byte. */
export const IMAGE_CDN_ORIGINS = [
  "https://res.cloudinary.com",
  "https://pub-1bc01021a631452885c83bc1cc30d706.r2.dev",
] as const;
