import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import { verifyPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

// GET /api/wallet/verify - Paystack redirect handler for wallet funding
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.redirect(new URL("/dashboard/wallet?funding=missing_reference", request.url));
    }

    const tx = await WalletTransaction.findOne({ reference, type: "wallet_funding" });
    if (!tx) {
      return NextResponse.redirect(new URL("/dashboard/wallet?funding=not_found", request.url));
    }

    if (tx.status === "success") {
      return NextResponse.redirect(new URL(`/dashboard/wallet?funding=success&reference=${encodeURIComponent(reference)}`, request.url));
    }

    // Verify payment with Paystack
    const verification = await verifyPayment("paystack", reference);
    const data: any = (verification as any)?.data;

    const isSuccessful = (verification as any)?.status === true || data?.status === "success";
    const amountKobo = Number(data?.amount);

    if (isSuccessful && Number.isFinite(amountKobo) && amountKobo === tx.amount) {
      tx.status = "success";
      tx.providerReference = String(data?.id ?? "");
      tx.metadata = {
        ...(tx.metadata || {}),
        paidAt: data?.paid_at,
        gatewayResponse: data?.gateway_response,
        channel: data?.channel,
      };
      await tx.save();

      return NextResponse.redirect(new URL(`/dashboard/wallet?funding=success&reference=${encodeURIComponent(reference)}`, request.url));
    }

    tx.status = "failed";
    tx.metadata = { ...(tx.metadata || {}), verifyFailed: true, verifyStatus: data?.status, amount: data?.amount };
    await tx.save();

    return NextResponse.redirect(new URL(`/dashboard/wallet?funding=failed&reference=${encodeURIComponent(reference)}`, request.url));
  } catch (error: any) {
    console.error("Wallet verify error:", error);
    return NextResponse.redirect(new URL("/dashboard/wallet?funding=verify_error", request.url));
  }
}

