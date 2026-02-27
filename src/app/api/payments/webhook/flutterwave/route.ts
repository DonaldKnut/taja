import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyPayment, escrow } from "@/lib/payments";
import Order from "@/models/Order";
import { notifyPaymentUpdate, notifyAdminsPaymentReceived } from "@/lib/notifications";
import crypto from "crypto";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import PlatformSettings from "@/models/PlatformSettings";

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
 * POST /api/payments/webhook/flutterwave
 * Flutterwave webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH || "";

    // Verify webhook signature (if secret hash is configured)
    if (secretHash) {
      const signature = request.headers.get("verif-hash");
      if (!signature) {
        return NextResponse.json(
          { success: false, message: "Missing signature" },
          { status: 401 }
        );
      }

      // Verify signature matches
      const hash = crypto
        .createHmac("sha256", secretHash)
        .update(JSON.stringify(body))
        .digest("hex");

      if (hash !== signature) {
        return NextResponse.json(
          { success: false, message: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = body.event;
    const data = body.data;

    if (event === "charge.completed" && data.status === "successful") {
      const txRef = data.tx_ref;
      const order = await Order.findOne({ paymentReference: txRef });

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
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
          txRef
        );

        await createReferralBonusHold({
          buyerId: order.buyer.toString(),
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          totalNaira: order.totals.total,
          paymentReference: txRef,
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
    console.error("Flutterwave webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}





