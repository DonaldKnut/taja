import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";
import { initializePayment } from "@/lib/payments";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// POST /api/wallet/fund - Initialize Paystack wallet funding
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const amountNaira = Number(body?.amount);

      if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
        return NextResponse.json(
          { success: false, message: "Valid amount is required" },
          { status: 400 }
        );
      }

      // Basic minimum to avoid dust payments
      if (amountNaira < 100) {
        return NextResponse.json(
          { success: false, message: "Minimum funding amount is ₦100" },
          { status: 400 }
        );
      }

      const reference = `WALLET-${uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.FRONTEND_URL ||
        "https://tajaapp.shop";

      const redirectUrl = `${baseUrl}/api/wallet/verify?reference=${reference}`;

      // Create pending wallet transaction (store in kobo)
      await WalletTransaction.create({
        user: user.userId,
        type: "wallet_funding",
        status: "pending",
        direction: "credit",
        amount: Math.round(amountNaira * 100),
        currency: "NGN",
        reference,
        provider: "paystack",
        description: "Wallet funding",
        metadata: {
          kind: "wallet_funding",
          userId: user.userId,
        },
      });

      const userDoc = await User.findById(user.userId).select("fullName email phone").lean();
      const email = (userDoc as any)?.email || user.email;
      const fullname = (userDoc as any)?.fullName || "Customer";
      const phone = (userDoc as any)?.phone;

      const paymentResponse = await initializePayment("paystack", {
        amount: amountNaira,
        email,
        fullname,
        reference,
        redirectUrl,
        phone,
        metadata: {
          kind: "wallet_funding",
          userId: user.userId,
        },
      });

      const paymentUrl =
        (paymentResponse.data as any)?.link ||
        (paymentResponse.data as any)?.authorization_url;

      return NextResponse.json({
        success: true,
        message: "Wallet funding initialized",
        data: {
          reference,
          paymentUrl,
        },
      });
    } catch (error: any) {
      console.error("Wallet funding init error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to initialize wallet funding" },
        { status: 500 }
      );
    }
  })(request);
}

