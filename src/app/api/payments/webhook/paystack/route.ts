import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyPayment, escrow } from "@/lib/payments";
import Order from "@/models/Order";
import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";
import PlatformSettings from "@/models/PlatformSettings";
import { notifyPaymentUpdate, notifyAdminsPaymentReceived } from "@/lib/notifications";
import crypto from "crypto";

async function getReferralSettings() {
  const envPct = parseFloat(process.env.REFERRAL_BONUS_PERCENTAGE || "2");
  const enabledEnv = process.env.REFERRAL_ENABLED === "false" ? false : true;

  const doc = await PlatformSettings.findOne().select("referral").lean();
  const referral = (doc as any)?.referral || {};

  const enabled = typeof referral.enabled === "boolean" ? referral.enabled : enabledEnv;
  const bonusPercentage =
    typeof referral.bonusPercentage === "number" && referral.bonusPercentage >= 0
      ? referral.bonusPercentage
      : envPct;

  return { enabled, bonusPercentage };
}

async function createReferralBonusHold(params: {
  buyerId: string;
  orderId: string;
  orderNumber: string;
  totalNaira: number;
  paymentReference: string;
}) {
  try {
    const { enabled, bonusPercentage } = await getReferralSettings();
    if (!enabled || !bonusPercentage || bonusPercentage <= 0) return;
    const buyer = await User.findById(params.buyerId).select("referredBy").lean();
    const referrerId = (buyer as any)?.referredBy?.toString();
    if (!referrerId || referrerId === params.buyerId) return;

    const reference = `REFBONUS-${params.orderId}`;
    const exists = await WalletTransaction.findOne({ reference }).select("_id").lean();
    if (exists?._id) return;

    const rewardKobo = Math.max(0, Math.round((params.totalNaira * 100 * bonusPercentage) / 100));
    if (!rewardKobo) return;

    await WalletTransaction.create({
      user: referrerId,
      type: "referral_bonus",
      status: "held",
      direction: "credit",
      amount: rewardKobo,
      currency: "NGN",
      reference,
      provider: "internal",
      description: `Referral bonus (pending) for order ${params.orderNumber}`,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        buyerId: params.buyerId,
        paymentReference: params.paymentReference,
        percentage: bonusPercentage,
      },
    });
  } catch (e) {
    console.error("Referral bonus hold error:", e);
  }
}

/**
 * POST /api/payments/webhook/paystack
 * Paystack webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const secretKey = process.env.PAYSTACK_SECRET_KEY || "";

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(JSON.stringify(body))
      .digest("hex");

    const signature = request.headers.get("x-paystack-signature");
    if (hash !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = body.event;
    const data = body.data;

    if (event === "charge.success" && data.status === "success") {
      const reference = data.reference;
      const order = await Order.findOne({ paymentReference: reference });

      // Not an order payment? Try wallet funding.
      if (!order) {
        const walletTx = await WalletTransaction.findOne({
          reference,
          type: "wallet_funding",
          direction: "credit",
        });

        if (walletTx && walletTx.status !== "success") {
          const amountKobo = Number(data.amount);
          if (Number.isFinite(amountKobo) && amountKobo === walletTx.amount) {
            walletTx.status = "success";
            walletTx.providerReference = String(data.id ?? "");
            walletTx.metadata = {
              ...(walletTx.metadata || {}),
              paidAt: data.paid_at,
              gatewayResponse: data.gateway_response,
              channel: data.channel,
              currency: data.currency,
            };
            await walletTx.save();
          } else {
            walletTx.status = "failed";
            walletTx.metadata = { ...(walletTx.metadata || {}), webhookAmount: data.amount, webhookCurrency: data.currency };
            await walletTx.save();
          }
        }

        return NextResponse.json({ success: true, message: "Webhook processed" });
      }

      if (order.paymentStatus !== "paid") {
        // Update order payment status
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            paymentStatus: "paid",
          },
        });

        // Create escrow hold
        await escrow.createEscrowHold(
          order._id.toString(),
          order.totals.total,
          reference
        );

        await createReferralBonusHold({
          buyerId: order.buyer.toString(),
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          totalNaira: order.totals.total,
          paymentReference: reference,
        });

        // Notify buyer and seller
        await notifyPaymentUpdate(
          order.buyer.toString(),
          order.orderNumber,
          "paid"
        );
        await notifyPaymentUpdate(
          order.seller.toString(),
          order.orderNumber,
          "paid"
        );

        await notifyAdminsPaymentReceived({
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          totalNaira: order.totals.total,
        });
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}





