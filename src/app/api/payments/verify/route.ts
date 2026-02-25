import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyPayment, escrow, PaymentProvider } from "@/lib/payments";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { notifyPaymentUpdate, notifyAdminsPaymentReceived } from "@/lib/notifications";

const REFERRAL_BONUS_PERCENTAGE = parseFloat(process.env.REFERRAL_BONUS_PERCENTAGE || "2"); // default 2%

async function createReferralBonusHold(params: {
  buyerId: string;
  orderId: string;
  orderNumber: string;
  totalNaira: number;
  paymentReference: string;
}) {
  try {
    if (!REFERRAL_BONUS_PERCENTAGE || REFERRAL_BONUS_PERCENTAGE <= 0) return;

    const buyer = await User.findById(params.buyerId).select("referredBy").lean();
    const referrerId = (buyer as any)?.referredBy?.toString();
    if (!referrerId) return;
    if (referrerId === params.buyerId) return;

    const reference = `REFBONUS-${params.orderId}`;
    const exists = await WalletTransaction.findOne({ reference }).select("_id").lean();
    if (exists?._id) return;

    const rewardKobo = Math.max(
      0,
      Math.round((params.totalNaira * 100 * REFERRAL_BONUS_PERCENTAGE) / 100)
    );
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
        percentage: REFERRAL_BONUS_PERCENTAGE,
      },
    });
  } catch (e) {
    console.error("Referral bonus hold error:", e);
  }
}

/**
 * GET /api/payments/verify
 * Verify payment after buyer completes payment
 * This is called as a redirect from payment gateway
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");
    const orderId = searchParams.get("orderId");
    const provider = searchParams.get("provider") || "auto";

    if (!reference) {
      return NextResponse.redirect(
        new URL("/dashboard/orders?error=missing_reference", request.url)
      );
    }

    if (!orderId) {
      return NextResponse.redirect(
        new URL("/dashboard/orders?error=missing_order", request.url)
      );
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.redirect(
        new URL("/dashboard/orders?error=order_not_found", request.url)
      );
    }

    // Verify payment
    const verification = await verifyPayment(provider as PaymentProvider | "auto", reference);

    // Check if payment was successful
    const isSuccessful =
      (verification.status === "success" || verification.data?.status === "successful") &&
      (verification.data?.amount === order.totals.total ||
        verification.data?.amount === order.totals.total * 100); // Handle kobo conversion

    if (isSuccessful) {
      // Update order payment status
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus: "paid",
          paymentReference: reference,
        },
      });

      // Create escrow hold
      await escrow.createEscrowHold(
        orderId,
        order.totals.total,
        reference
      );

      // Create referral bonus (held until escrow release)
      await createReferralBonusHold({
        buyerId: order.buyer.toString(),
        orderId,
        orderNumber: order.orderNumber,
        totalNaira: order.totals.total,
        paymentReference: reference,
      });

      // Notify buyer
      await notifyPaymentUpdate(
        order.buyer.toString(),
        order.orderNumber,
        "paid"
      );

      // Notify seller
      await notifyPaymentUpdate(
        order.seller.toString(),
        order.orderNumber,
        "paid"
      );

      // Notify admins: payment received and funds in escrow (follow process to release after delivery)
      await notifyAdminsPaymentReceived({
        orderId,
        orderNumber: order.orderNumber,
        totalNaira: order.totals.total,
      });

      return NextResponse.redirect(
        new URL(`/dashboard/orders/${orderId}?payment=success`, request.url)
      );
    } else {
      // Payment failed
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus: "failed",
        },
      });

      return NextResponse.redirect(
        new URL(`/dashboard/orders/${orderId}?payment=failed`, request.url)
      );
    }
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/orders?error=verification_failed", request.url)
    );
  }
}

/**
 * POST /api/payments/verify
 * Verify payment via webhook (called by payment gateway)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const reference = body.data?.reference || body.data?.tx_ref || body.reference;
    const provider = body.provider || "auto";

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Reference is required" },
        { status: 400 }
      );
    }

    // Find order by payment reference
    const order = await Order.findOne({ paymentReference: reference });
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Verify payment
    const verification = await verifyPayment(provider as PaymentProvider | "auto", reference);

    // Check if payment was successful
    const isSuccessful =
      (verification.status === "success" || verification.data?.status === "successful") &&
      (verification.data?.amount === order.totals.total ||
        verification.data?.amount === order.totals.total * 100);

    if (isSuccessful && order.paymentStatus !== "paid") {
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

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Payment webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}





