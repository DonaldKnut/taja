import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { connectDB } from "@/lib/db";
import { transferToSeller, escrow } from "@/lib/payments";
import { getBankCode } from "@/lib/payments/bankCodes";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/payments/payout
 * Release escrow and transfer funds to seller
 */
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const { orderId, provider = "auto" } = body;

      if (!orderId) {
        return NextResponse.json(
          { success: false, message: "Order ID is required" },
          { status: 400 }
        );
      }

      // Get order
      const order = await Order.findById(orderId)
        .populate("seller", "fullName email phone kyc");

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      // Verify user is buyer (escrow owner) or admin
      const isBuyer = order.buyer.toString() === user.userId;
      const isAdmin = user.role === "admin";

      if (!isBuyer && !isAdmin) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }

      // Escrow safety: require buyer confirmation (admin can override)
      const confirmedAt = (order as any)?.delivery?.confirmedAt;
      if (!isAdmin && !confirmedAt) {
        return NextResponse.json(
          {
            success: false,
            message: "Buyer has not confirmed delivery yet. Escrow cannot be released.",
            code: "ESCROW_CONFIRMATION_REQUIRED",
          },
          { status: 400 }
        );
      }

      // Check if escrow can be released
      const canRelease = await escrow.canReleaseEscrow(orderId);
      if (!canRelease) {
        return NextResponse.json(
          {
            success: false,
            message: "Escrow cannot be released. Order must be delivered and payment confirmed.",
          },
          { status: 400 }
        );
      }

      // Get escrow hold
      const escrowHold = await escrow.getEscrowHold(orderId);
      if (!escrowHold || escrowHold.status !== "held") {
        return NextResponse.json(
          { success: false, message: "Escrow is not in held status" },
          { status: 400 }
        );
      }

      // Get seller bank details from KYC
      const seller = order.seller as any;
      if (!seller.kyc || !seller.kyc.accountNumber || !seller.kyc.bankName) {
        return NextResponse.json(
          {
            success: false,
            message: "Seller bank account details not found. Please complete KYC verification.",
          },
          { status: 400 }
        );
      }

      // Get bank code from bank name
      const bankCode = seller.kyc.bankCode || getBankCode(seller.kyc.bankName);

      if (!bankCode) {
        return NextResponse.json(
          {
            success: false,
            message: `Bank code not found for "${seller.kyc.bankName}". Please update seller bank details with a valid Nigerian bank.`,
          },
          { status: 400 }
        );
      }

      // Transfer funds to seller
      const transferReference = `PAYOUT-${uuidv4().substring(0, 8).toUpperCase()}`;
      const transferResult = await transferToSeller(provider, {
        accountNumber: seller.kyc.accountNumber,
        bankCode: bankCode,
        amount: escrowHold.sellerAmount,
        recipientName: seller.kyc.accountName || seller.fullName,
        reference: transferReference,
        narration: `Payment for order ${order.orderNumber}`,
      });

      // Release escrow
      await escrow.releaseEscrowToSeller(orderId);

      // Unlock referral bonus after escrow release (if any)
      try {
        const bonusRef = `REFBONUS-${orderId}`;
        const bonusTx: any = await WalletTransaction.findOneAndUpdate(
          { reference: bonusRef, type: "referral_bonus", status: "held" },
          { $set: { status: "success" } },
          { new: true }
        ).lean();
        if (bonusTx?.user && bonusTx?.amount) {
          await User.findByIdAndUpdate(bonusTx.user, {
            $inc: {
              "referralStats.totalEarnedKobo": bonusTx.amount,
            },
          });
        }
      } catch (e) {
        console.error("Referral bonus unlock error:", e);
      }

      // Update order with payout information
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          payoutReference: transferReference,
          payoutStatus: "completed",
          payoutCompletedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payout processed successfully",
        data: {
          transferReference,
          amount: escrowHold.sellerAmount,
          platformFee: escrowHold.platformFee,
          orderId: order._id,
        },
      });
    } catch (error: any) {
      console.error("Payout error:", error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Failed to process payout",
        },
        { status: 500 }
      );
    }
  })(request);
}






