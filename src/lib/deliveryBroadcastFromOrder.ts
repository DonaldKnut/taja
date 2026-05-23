import { createHash, randomInt } from "crypto";
import mongoose from "mongoose";
import Order from "@/models/Order";
import DeliveryJob from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateOtp() {
  return String(randomInt(100000, 999999));
}

export type BroadcastActorRole = "admin" | "seller";

/**
 * Creates an open delivery job (rider broadcast) for an order.
 * Used by admin dispatch and seller “request rider” flows.
 */
export async function createBroadcastDeliveryJobForOrder(input: {
  orderId: string;
  actorUserId: string;
  actorRole: BroadcastActorRole;
  radiusKm?: number;
  ttlMinutes?: number;
  deliveryFeeKobo?: number;
  pickupAddress?: string;
}) {
  const orderId = String(input.orderId || "").trim();
  if (!orderId) {
    return { ok: false as const, status: 400, message: "orderId is required" };
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    return { ok: false as const, status: 404, message: "Order not found" };
  }

  const existingOpen = await DeliveryJob.findOne({
    order: order._id,
    status: { $in: ["open", "reserved", "picked_up"] },
  }).lean();
  if (existingOpen) {
    return {
      ok: false as const,
      status: 409,
      message: "An active delivery job already exists for this order",
    };
  }

  const radiusKm = Number(input.radiusKm || 10);
  const ttlMinutes = Number(input.ttlMinutes || 20);
  const deliveryFeeKobo = Number(input.deliveryFeeKobo || 0);
  const pickupOtp = generateOtp();
  const deliveryOtp = generateOtp();
  const expiresAt = new Date(Date.now() + Math.max(5, ttlMinutes) * 60 * 1000);
  const valueKobo = Math.max(100, Math.round(Number((order as any)?.totals?.total || 0) * 100));

  const doc = await DeliveryJob.create({
    order: order._id,
    seller: (order as any).seller,
    shop: (order as any).shop,
    status: "open",
    valueKobo,
    deliveryFeeKobo: Math.max(0, Math.round(deliveryFeeKobo)),
    pickup: {
      state: (order as any).shippingAddress?.state || "Unknown",
      city: (order as any).shippingAddress?.city || "Unknown",
      address: input.pickupAddress || "Seller dispatch point",
    },
    dropoff: {
      state: (order as any).shippingAddress?.state || "Unknown",
      city: (order as any).shippingAddress?.city || "Unknown",
      address: (order as any).shippingAddress?.addressLine1 || "Buyer address",
    },
    broadcast: {
      radiusKm: Math.max(1, radiusKm),
      expiresAt,
    },
    otp: {
      pickupCodeHash: hashCode(pickupOtp),
      deliveryCodeHash: hashCode(deliveryOtp),
    },
    proof: {
      pickupPhotos: [],
      deliveryPhotos: [],
    },
  });

  const actorOid = mongoose.Types.ObjectId.isValid(input.actorUserId)
    ? new mongoose.Types.ObjectId(input.actorUserId)
    : undefined;

  await DeliveryEvent.create({
    job: doc._id,
    actorUserId: actorOid,
    actorRole: input.actorRole,
    eventType: "broadcast_created",
    metadata: {
      orderId: String(order._id),
      radiusKm: Math.max(1, radiusKm),
      ttlMinutes: Math.max(5, ttlMinutes),
    },
  });

  return {
    ok: true as const,
    job: doc,
    pickupOtp,
    deliveryOtp,
    orderNumber: (order as { orderNumber?: string }).orderNumber,
  };
}
