/**
 * Normalizes variant id so one cart line = one product + one sellable SKU.
 * UI uses "standard" for base product; API may omit variantId — those must match.
 */
export function cartVariantKey(variantId?: string | null): string {
  if (variantId == null || variantId === "") return "";
  const s = String(variantId).trim();
  if (s === "standard") return "";
  return s;
}

export function sameCartLine(
  productIdA: string,
  variantA: string | null | undefined,
  productIdB: string,
  variantB: string | null | undefined
): boolean {
  return String(productIdA) === String(productIdB) && cartVariantKey(variantA) === cartVariantKey(variantB);
}

/** Collapse duplicate Mongo subdocs (same product + logical variant) into one row. */
export function compactCartDocumentItems(
  items: Array<{
    product: unknown;
    quantity: number;
    variantId?: string | null;
    variantName?: string | null;
    addedAt?: Date;
  }>
): Array<{
  product: unknown;
  quantity: number;
  variantId?: string;
  variantName?: string;
  addedAt: Date;
}> {
  if (!items?.length) return [];
  const map = new Map<
    string,
    { product: unknown; quantity: number; variantId?: string; variantName?: string; addedAt: Date }
  >();
  for (const it of items) {
    const pid = String((it as any).product?._id ?? (it as any).product);
    const vk = cartVariantKey((it as any).variantId);
    const key = `${pid}::${vk}`;
    const existing = map.get(key);
    const qty = Math.max(1, Number((it as any).quantity) || 1);
    if (existing) {
      existing.quantity += qty;
    } else {
      const rawVid = (it as any).variantId;
      const storeVid = vk === "" ? undefined : rawVid != null && String(rawVid).trim() ? String(rawVid).trim() : undefined;
      map.set(key, {
        product: (it as any).product,
        quantity: qty,
        variantId: storeVid,
        variantName: (it as any).variantName || undefined,
        addedAt: (it as any).addedAt || new Date(),
      });
    }
  }
  return Array.from(map.values());
}
