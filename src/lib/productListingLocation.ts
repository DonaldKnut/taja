/**
 * Optional per-product "ships from" / listing location.
 * When absent, UIs should fall back to the shop's business address.
 */
export type ListingLocation = {
  city?: string;
  state?: string;
  country?: string;
};

export function sanitizeListingLocation(input: unknown): ListingLocation | undefined {
  if (input == null || typeof input !== "object") return undefined;
  const o = input as Record<string, unknown>;
  const trim = (v: unknown, max = 96) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const city = trim(o.city);
  const state = trim(o.state);
  const country = trim(o.country) || "Nigeria";
  if (!city && !state) return undefined;
  return {
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    country,
  };
}

export function listingLocationParts(loc?: ListingLocation | null): string[] {
  if (!loc) return [];
  return [loc.city, loc.state].filter((s): s is string => Boolean(s && String(s).trim()));
}

/** Display line: prefer explicit listing, then shop address, then legacy string. */
export function resolveProductLocationLabel(
  product: {
    listingLocation?: ListingLocation | null;
    location?: string;
  },
  shop?: { address?: { city?: string; state?: string; country?: string } } | null
): string {
  const fromProduct = listingLocationParts(product.listingLocation || undefined);
  if (fromProduct.length) return fromProduct.join(", ");
  const fromShop = [shop?.address?.city, shop?.address?.state].filter(Boolean) as string[];
  if (fromShop.length) return fromShop.join(", ");
  if (typeof product.location === "string" && product.location.trim()) {
    return product.location.trim();
  }
  return "";
}
