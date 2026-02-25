/**
 * Escrow Management System
 * 
 * This module manages escrow holds for orders:
 * - Create escrow holds when payment is verified
 * - Release escrow to sellers after delivery confirmation
 * - Refund escrow to buyers for disputes/cancellations
 * - Calculate platform fees
 */

import Order from "@/models/Order";
import { connectDB } from "@/lib/db";

export interface EscrowHold {
  orderId: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: "held" | "released" | "refunded";
  holdReference?: string; // Reference from payment gateway
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
}

const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "7"); // Default 7%

/**
 * Calculate platform fee and seller amount
 */
export function calculateEscrowAmounts(totalAmount: number): {
  platformFee: number;
  sellerAmount: number;
} {
  const platformFee = Math.round((totalAmount * PLATFORM_FEE_PERCENTAGE) / 100);
  const sellerAmount = totalAmount - platformFee;

  return {
    platformFee,
    sellerAmount,
  };
}

/**
 * Create escrow hold for an order
 */
export async function createEscrowHold(
  orderId: string,
  amount: number,
  holdReference?: string
): Promise<EscrowHold> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const { platformFee, sellerAmount } = calculateEscrowAmounts(amount);

  // Store escrow information in order
  const escrowHold: EscrowHold = {
    orderId,
    amount,
    platformFee,
    sellerAmount,
    status: "held",
    holdReference,
    createdAt: new Date(),
  };

  // Update order with escrow information
  await Order.findByIdAndUpdate(orderId, {
    $set: {
      escrowStatus: "funded",
      escrowReference: holdReference,
      escrowHold: escrowHold,
    },
  });

  return escrowHold;
}

/**
 * Release escrow to seller
 */
export async function releaseEscrowToSeller(orderId: string): Promise<EscrowHold> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.escrowHold || order.escrowHold.status !== "held") {
    throw new Error("Escrow is not in held status");
  }

  const escrowHold = order.escrowHold as EscrowHold;
  escrowHold.status = "released";
  escrowHold.releasedAt = new Date();

  // Update order
  await Order.findByIdAndUpdate(orderId, {
    $set: {
      escrowStatus: "released",
      escrowHold: escrowHold,
    },
  });

  return escrowHold;
}

/**
 * Refund escrow to buyer
 */
export async function refundEscrowToBuyer(orderId: string, reason?: string): Promise<EscrowHold> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.escrowHold || order.escrowHold.status !== "held") {
    throw new Error("Escrow is not in held status");
  }

  const escrowHold = order.escrowHold as EscrowHold;
  escrowHold.status = "refunded";
  escrowHold.refundedAt = new Date();

  // Update order
  await Order.findByIdAndUpdate(orderId, {
    $set: {
      escrowStatus: "refunded",
      paymentStatus: "refunded",
      escrowHold: escrowHold,
      refundReason: reason,
    },
  });

  return escrowHold;
}

/**
 * Get escrow hold for an order
 */
export async function getEscrowHold(orderId: string): Promise<EscrowHold | null> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order || !order.escrowHold) {
    return null;
  }

  return order.escrowHold as EscrowHold;
}

/**
 * Check if escrow can be released (order delivered and confirmed)
 */
export async function canReleaseEscrow(orderId: string): Promise<boolean> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order) {
    return false;
  }

  // Escrow can be released if:
  // 1. Order is delivered
  // 2. Payment is paid
  // 3. Escrow is held (not already released/refunded)
  return (
    order.status === "delivered" &&
    order.paymentStatus === "paid" &&
    order.escrowStatus === "funded"
  );
}

/**
 * Auto-release escrow after delivery confirmation period (7 days default)
 */
export async function autoReleaseEscrowAfterPeriod(orderId: string, days: number = 7): Promise<boolean> {
  await connectDB();

  const order = await Order.findById(orderId);
  if (!order || !order.delivery?.deliveredAt) {
    return false;
  }

  const deliveredAt = new Date(order.delivery.deliveredAt);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceDelivery >= days && order.escrowStatus === "funded") {
    await releaseEscrowToSeller(orderId);
    return true;
  }

  return false;
}





