import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyGokadaWebhookSignature, mapGokadaStatusToOrderStatus } from "@/lib/delivery/gokada";
import Order from "@/models/Order";
import { notifyDeliveryUpdate, notifyOrderUpdate } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/delivery/webhook/gokada
 * Handle Gokada delivery webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = JSON.stringify(body);
    
    // Verify webhook signature if secret is configured
    const secretHash = process.env.GOKADA_WEBHOOK_SECRET || "";
    if (secretHash) {
      const signature = request.headers.get("x-gokada-signature");
      if (!signature || !verifyGokadaWebhookSignature(payload, signature, secretHash)) {
        return NextResponse.json(
          { success: false, message: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    await connectDB();

    const { event, data } = body;
    const trackingNumber = data.tracking_number || data.order_id;

    // Find the order by tracking number
    const order = await Order.findOne({ "delivery.trackingNumber": trackingNumber })
      .populate("buyer", "_id")
      .populate("seller", "_id");

    if (!order) {
      console.warn(`Order not found for tracking number: ${trackingNumber}`);
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Map Gokada status to our internal status
    const newStatus = mapGokadaStatusToOrderStatus(data.status || event);

    // Update order based on event type
    switch (event) {
      case "order.assigned":
      case "order.picked_up":
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: newStatus,
            "delivery.driver": data.rider ? {
              name: data.rider.name,
              phone: data.rider.phone,
              vehicleType: data.rider.vehicle_type,
              vehicleNumber: data.rider.vehicle_number,
            } : undefined,
          },
        });
        break;

      case "order.in_transit":
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: newStatus,
          },
        });
        // Notify buyer
        await notifyDeliveryUpdate(
          order.buyer._id.toString(),
          order.orderNumber,
          newStatus,
          trackingNumber,
          order._id.toString()
        );
        break;

      case "order.delivered":
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: newStatus,
            "delivery.deliveredAt": new Date(),
            "delivery.proofOfDelivery": data.proof_of_delivery ? {
              signatureUrl: data.proof_of_delivery.signature_url,
              photoUrl: data.proof_of_delivery.photo_url,
              recipientName: data.proof_of_delivery.recipient_name,
              timestamp: new Date(data.proof_of_delivery.timestamp),
            } : undefined,
          },
        });
        // Notify both buyer and seller
        await notifyDeliveryUpdate(
          order.buyer._id.toString(),
          order.orderNumber,
          newStatus,
          trackingNumber,
          order._id.toString()
        );
        await notifyOrderUpdate(
          order.seller._id.toString(),
          order.orderNumber,
          newStatus,
          order._id.toString()
        );
        break;

      case "order.cancelled":
      case "order.failed":
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: newStatus,
            "delivery.failureReason": data.note || "Delivery failed",
          },
        });
        await notifyDeliveryUpdate(
          order.buyer._id.toString(),
          order.orderNumber,
          newStatus,
          trackingNumber,
          order._id.toString()
        );
        break;

      case "rider.location_updated":
        // Just update current location, no notification needed
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            "delivery.currentLocation": data.location ? {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              address: data.location.address,
              updatedAt: new Date(),
            } : undefined,
          },
        });
        break;

      default:
        console.log(`Unhandled Gokada webhook event: ${event}`);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error: any) {
    console.error("Gokada webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
