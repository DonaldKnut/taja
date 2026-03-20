type PriceableVariant = {
  price?: number;
  active?: boolean;
} | null | undefined;

type PriceableProduct = {
  price: number;
  maxPrice?: number;
  variants?: PriceableVariant[];
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getEffectivePrice(basePrice: number, variantPrice?: number) {
  return isFiniteNumber(variantPrice) ? variantPrice : basePrice;
}

export function getProductDisplayPriceRange(product: PriceableProduct) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariants = variants.filter((variant) => variant && variant.active !== false);

  if (activeVariants.length === 0) {
    return {
      minPrice: product.price,
      maxPrice: isFiniteNumber(product.maxPrice) && product.maxPrice > product.price ? product.maxPrice : undefined,
    };
  }

  const effectivePrices = activeVariants.map((variant) => getEffectivePrice(product.price, variant?.price));

  if (effectivePrices.length === 0) {
    return {
      minPrice: product.price,
      maxPrice: isFiniteNumber(product.maxPrice) && product.maxPrice > product.price ? product.maxPrice : undefined,
    };
  }

  const minPrice = Math.min(...effectivePrices);
  const maxPrice = Math.max(...effectivePrices);

  return {
    minPrice,
    maxPrice: maxPrice > minPrice ? maxPrice : undefined,
  };
}
