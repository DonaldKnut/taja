import { quoteLagosDeliveryAddress, type LagosDeliveryQuote } from "@/lib/delivery/lagosPartnerQuote";

export type ProductShippingLike = {
  freeShipping?: boolean;
  shippingCost?: number;
  costPerKg?: number;
  weight?: number;
  lagosMainlandDelivery?: number | null;
  lagosIslandDelivery?: number | null;
  shippingPayer?: "buyer" | "seller" | "platform" | "split";
};

export type CheckoutShippingLine = {
  quantity: number;
  shipping?: ProductShippingLike;
};

export function isLagosIslandPremiumZone(zoneLabel: string): boolean {
  return zoneLabel.toLowerCase().includes("island");
}

/**
 * When non-null, seller configured Lagos mainland/island rates for this line.
 * When null, use flat `shippingCost` for this line (Lagos) or non-Lagos behavior is caller's concern.
 */
export function sellerLagosUnitNaira(
  shipping: ProductShippingLike | undefined,
  zoneLabel: string
): number | null {
  if (!shipping || shipping.freeShipping) return shipping?.freeShipping ? 0 : null;
  const m = shipping.lagosMainlandDelivery;
  const i = shipping.lagosIslandDelivery;
  const hasM = m != null && Number.isFinite(Number(m));
  const hasI = i != null && Number.isFinite(Number(i));
  if (!hasM && !hasI) return null;
  const mainland = hasM ? Number(m) : undefined;
  const island = hasI ? Number(i) : undefined;
  const base = Number(shipping.shippingCost) || 0;
  if (isLagosIslandPremiumZone(zoneLabel)) {
    return island ?? mainland ?? base;
  }
  return mainland ?? island ?? base;
}

export function sumLineShippingBeforeShopTiers(
  lines: CheckoutShippingLine[],
  resolvedShippingAddress: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
  }
): {
  shipping: number;
  anySellerLagosRates: boolean;
  lagosQuote: LagosDeliveryQuote | null;
  totalWeightKg: number;
  shippingPolicyAudit: {
    subsidizedNaira: number;
    subsidizedBySellerNaira: number;
    subsidizedByPlatformNaira: number;
    subsidizedBySplitNaira: number;
  };
} {
  const lagosQuote = quoteLagosDeliveryAddress(resolvedShippingAddress);
  let shipping = 0;
  let anySellerLagosRates = false;
  let totalWeightKg = 0;
  let subsidizedNaira = 0;
  let subsidizedBySellerNaira = 0;
  let subsidizedByPlatformNaira = 0;
  let subsidizedBySplitNaira = 0;

  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    const w = Number(line.shipping?.weight) || 0;
    totalWeightKg += w * qty;

    const flat = Number(line.shipping?.shippingCost) || 0;
    const weightBased = (Number(line.shipping?.costPerKg) || 0) * w;
    const fallbackUnit = flat > 0 ? flat : weightBased;
    let unitShipping = fallbackUnit;

    if (lagosQuote) {
      const unit = sellerLagosUnitNaira(line.shipping, lagosQuote.zoneLabel);
      if (unit !== null) {
        anySellerLagosRates = true;
        unitShipping = unit;
      }
    }
    const lineBase = unitShipping * qty;
    if (line.shipping?.freeShipping) {
      subsidizedNaira += lineBase;
      const payer = line.shipping?.shippingPayer || "seller";
      if (payer === "platform") subsidizedByPlatformNaira += lineBase;
      else if (payer === "split") subsidizedBySplitNaira += lineBase;
      else subsidizedBySellerNaira += lineBase;
      continue;
    }
    shipping += lineBase;
  }

  return {
    shipping,
    anySellerLagosRates,
    lagosQuote,
    totalWeightKg,
    shippingPolicyAudit: {
      subsidizedNaira,
      subsidizedBySellerNaira,
      subsidizedByPlatformNaira,
      subsidizedBySplitNaira,
    },
  };
}

export function finalizeLagosShippingNaira(opts: {
  preliminaryShipping: number;
  anySellerLagosRates: boolean;
  lagosQuote: LagosDeliveryQuote | null;
}): { shipping: number; deliveryQuoteSnapshot?: Record<string, unknown> } {
  const { preliminaryShipping, anySellerLagosRates, lagosQuote } = opts;
  if (!lagosQuote) {
    return { shipping: preliminaryShipping };
  }

  if (!anySellerLagosRates) {
    return {
      shipping: lagosQuote.priceNgn,
      deliveryQuoteSnapshot: {
        version: lagosQuote.version,
        zoneLabel: lagosQuote.zoneLabel,
        priceNgn: lagosQuote.priceNgn,
        isEstimate: lagosQuote.isEstimate,
        buyerNote: lagosQuote.buyerNote,
        matchedAlias: lagosQuote.matchedAlias,
        kind: lagosQuote.kind,
        usedSellerLagosRates: false,
        quotedAt: new Date(),
      },
    };
  }

  let shipping = preliminaryShipping;
  if (shipping === 0) {
    shipping = lagosQuote.priceNgn;
  }

  return {
    shipping,
    deliveryQuoteSnapshot: {
      version: lagosQuote.version,
      zoneLabel: lagosQuote.zoneLabel,
      platformReferenceNgn: lagosQuote.priceNgn,
      isEstimate: lagosQuote.isEstimate,
      buyerNote: lagosQuote.buyerNote,
      matchedAlias: lagosQuote.matchedAlias,
      kind: lagosQuote.kind,
      usedSellerLagosRates: true,
      quotedAt: new Date(),
    },
  };
}
