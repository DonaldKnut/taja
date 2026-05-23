type PriceableVariant = {
  price?: number;
  active?: boolean;
} | null | undefined;

type PriceableProduct = {
  price: number;
  variants?: PriceableVariant[];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Coerce API / form values (number or numeric string) for stable min/max math. */
function normalizePrice(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (isFiniteNumber(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function getEffectivePrice(basePrice: number, variantPrice?: number) {
  const base = normalizePrice(basePrice) ?? 0;
  const vp = normalizePrice(variantPrice);
  return vp !== undefined ? vp : base;
}

export function getProductDisplayPriceRange(product: PriceableProduct) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariants = variants.filter((variant) => variant && variant.active !== false);

  const basePrice = normalizePrice(product.price) ?? 0;

  // No variants: always a single list price. (Ranges come from base + variant prices only.)
  if (activeVariants.length === 0) {
    return {
      minPrice: basePrice,
      maxPrice: undefined,
    };
  }

  // Include the base product price in the range, not only variant overrides.
  // Example: base ₦4,000 + variant ₦5,000 → "₦4,000 - ₦5,000" on cards / PDP before a variant is chosen.
  const variantEffectivePrices = activeVariants.map((variant) =>
    getEffectivePrice(basePrice, variant?.price)
  );
  const allPrices = [basePrice, ...variantEffectivePrices];
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  return {
    minPrice,
    maxPrice: maxPrice > minPrice ? maxPrice : undefined,
  };
}
