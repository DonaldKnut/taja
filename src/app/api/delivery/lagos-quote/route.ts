import { NextRequest, NextResponse } from "next/server";
import { quoteLagosDeliveryAddress } from "@/lib/delivery/lagosPartnerQuote";

export const dynamic = "force-dynamic";

/**
 * POST /api/delivery/lagos-quote
 * Body: { addressLine1?, addressLine2?, city?, state? }
 * Returns zone-based Lagos delivery estimate (no auth; no PII stored).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const quote = quoteLagosDeliveryAddress({
      addressLine1: typeof body.addressLine1 === "string" ? body.addressLine1 : "",
      addressLine2: typeof body.addressLine2 === "string" ? body.addressLine2 : "",
      city: typeof body.city === "string" ? body.city : "",
      state: typeof body.state === "string" ? body.state : "",
    });

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
