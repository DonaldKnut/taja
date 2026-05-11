import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/middleware";
import Order from "@/models/Order";
import DeliveryJob from "@/models/DeliveryJob";
import DeliveryEvent from "@/models/DeliveryEvent";

export const dynamic = "force-dynamic";

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateOtp() {
  return String(randomInt(100000, 999999));
}

// POST /api/admin/logistics/jobs/broadcast - create nearby first-to-accept job
export async function POST(request: NextRequest) {
  return requireRole(["admin"])(async (_req, user) => {
    try {
      await connectDB();
      const body = await request.json();
      const orderId = String(body?.orderId || "").trim();
      const radiusKm = Number(body?.radiusKm || 10);
      const ttlMinutes = Number(body?.ttlMinutes || 20);
      const deliveryFeeKobo = Number(body?.deliveryFeeKobo || 0);

      if (!orderId) {
        return NextResponse.json({ success: false, message: "orderId is required" }, { status: 400 });
      }

      const order = await Order.findById(orderId).lean();
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
      const existingOpen = await DeliveryJob.findOne({
        order: order._id,
        status: { $in: ["open", "reserved", "picked_up"] },
      }).lean();
      if (existingOpen) {
        return NextResponse.json(
          { success: false, message: "An active delivery job already exists for this order" },
          { status: 409 }
        );
      }

      const pickupOtp = generateOtp();
      const deliveryOtp = generateOtp();
      const expiresAt = new Date(Date.now() + Math.max(5, ttlMinutes) * 60 * 1000);
      const valueKobo = Math.max(100, Math.round(Number(order?.totals?.total || 0) * 100));

      const doc = await DeliveryJob.create({
        order: order._id,
        seller: order.seller,
        shop: order.shop,
        status: "open",
        valueKobo,
        deliveryFeeKobo: Math.max(0, Math.round(deliveryFeeKobo)),
        pickup: {
          state: order.shippingAddress?.state || "Unknown",
          city: order.shippingAddress?.city || "Unknown",
          address: body?.pickupAddress || "Seller dispatch point",
        },
        dropoff: {
          state: order.shippingAddress?.state || "Unknown",
          city: order.shippingAddress?.city || "Unknown",
          address: order.shippingAddress?.addressLine1 || "Buyer address",
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
      await DeliveryEvent.create({
        job: doc._id,
        actorUserId: user.userId,
        actorRole: "admin",
        eventType: "broadcast_created",
        metadata: {
          orderId: String(order._id),
          radiusKm: Math.max(1, radiusKm),
          ttlMinutes: Math.max(5, ttlMinutes),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Delivery job broadcast created",
        data: {
          job: doc,
          otp: {
            pickupCode: pickupOtp,
            deliveryCode: deliveryOtp,
          },
        },
      });
    } catch (error: any) {
      console.error("POST admin logistics jobs broadcast error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to create delivery job" },
        { status: 500 }
      );
    }
  })(request);
}
