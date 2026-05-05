import { quoteLagosDeliveryAddress, type LagosDeliveryQuote } from "@/lib/delivery/lagosPartnerQuote";

export type ProductShippingLike = {
  freeShipping?: boolean;
  shippingCost?: number;
  weight?: number;
  lagosMainlandDelivery?: number | null;
  lagosIslandDelivery?: number | null;
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
} {
  const lagosQuote = quoteLagosDeliveryAddress(resolvedShippingAddress);
  let shipping = 0;
  let anySellerLagosRates = false;
  let totalWeightKg = 0;

  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    const w = Number(line.shipping?.weight) || 0;
    totalWeightKg += w * qty;

    if (line.shipping?.freeShipping) {
      continue;
    }

    if (lagosQuote) {
      const unit = sellerLagosUnitNaira(line.shipping, lagosQuote.zoneLabel);
      if (unit !== null) {
        anySellerLagosRates = true;
        shipping += unit * qty;
      } else {
        shipping += (Number(line.shipping?.shippingCost) || 0) * qty;
      }
    } else {
      shipping += (Number(line.shipping?.shippingCost) || 0) * qty;
    }
  }

  return { shipping, anySellerLagosRates, lagosQuote, totalWeightKg };
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
