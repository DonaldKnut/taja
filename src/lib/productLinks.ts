export function getProductPath(product: { slug?: string | null; _id?: string | null; id?: string | null }) {
  const slug = typeof product.slug === "string" ? product.slug.trim() : "";
  const fallbackId = String(product._id || product.id || "").trim();
  const identifier = slug || fallbackId;
  return identifier ? `/product/${identifier}` : "/marketplace";
}

export function getAbsoluteProductUrl(
  product: { slug?: string | null; _id?: string | null; id?: string | null },
  origin?: string
) {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "");
  const path = getProductPath(product);
  return `${String(base).replace(/\/$/, "")}${path}`;
}

