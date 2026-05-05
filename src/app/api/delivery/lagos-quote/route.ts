import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { quoteLagosDeliveryAddress } from "@/lib/delivery/lagosPartnerQuote";
import {
  sumLineShippingBeforeShopTiers,
  finalizeLagosShippingNaira,
  type CheckoutShippingLine,
} from "@/lib/delivery/checkoutShipping";

export const dynamic = "force-dynamic";

/**
 * POST /api/delivery/lagos-quote
 * Body: { addressLine1?, addressLine2?, city?, state?, items?: { productId: string, quantity: number }[] }
 * When `items` is provided, returns cart-aligned delivery total (seller Lagos rates + platform table).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const addr = {
      addressLine1: typeof body.addressLine1 === "string" ? body.addressLine1 : "",
      addressLine2: typeof body.addressLine2 === "string" ? body.addressLine2 : "",
      city: typeof body.city === "string" ? body.city : "",
      state: typeof body.state === "string" ? body.state : "",
    };

    const rawItems = Array.isArray(body.items) ? body.items : null;
    if (rawItems && rawItems.length > 0) {
      await connectDB();
      const lines: CheckoutShippingLine[] = [];
      for (const it of rawItems) {
        const productId = typeof it?.productId === "string" ? it.productId : "";
        const qty = Number(it?.quantity) || 0;
        if (!productId || qty <= 0) continue;
        const product = await Product.findById(productId).select("shipping status").lean();
        if (!product || (product as any).status !== "active") continue;
        const sh: any = (product as any).shipping || {};
        lines.push({
          quantity: qty,
          shipping: {
            freeShipping: !!sh.freeShipping,
            shippingCost: typeof sh.shippingCost === "number" ? sh.shippingCost : 0,
            weight: typeof sh.weight === "number" ? sh.weight : 0,
            lagosMainlandDelivery: sh.lagosMainlandDelivery,
            lagosIslandDelivery: sh.lagosIslandDelivery,
          },
        });
      }

      if (lines.length > 0) {
        const { shipping: preliminary, anySellerLagosRates, lagosQuote } = sumLineShippingBeforeShopTiers(
          lines,
          addr
        );
        const fin = finalizeLagosShippingNaira({
          preliminaryShipping: preliminary,
          anySellerLagosRates,
          lagosQuote,
        });

        return NextResponse.json({
          success: true,
          data: {
            priceNgn: fin.shipping,
            zoneLabel: lagosQuote?.zoneLabel ?? null,
            kind: lagosQuote?.kind ?? "unknown",
            isEstimate: (lagosQuote?.isEstimate ?? false) || anySellerLagosRates,
            buyerNote: lagosQuote?.buyerNote,
            matchedAlias: lagosQuote?.matchedAlias,
            version: lagosQuote?.version ?? null,
            usedSellerLagosRates: anySellerLagosRates,
          },
        });
      }
    }

    const quote = quoteLagosDeliveryAddress(addr);

    if (!quote) {
      return NextResponse.json({
        success: true,
        data: {
          priceNgn: null,
          zoneLabel: null,
          kind: "unknown",
          isEstimate: true,
          buyerNote: "Lagos-only zone quotes. Add a Lagos delivery address to see a fee.",
          version: null,
        },
      });
    }

    return NextResponse.json({ success: true, data: quote });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || "Quote failed" },
      { status: 500 }
    );
  }
}
