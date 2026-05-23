import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyKwikWebhookSignature, mapKwikStatusToOrderStatus } from "@/lib/delivery/kwik";
import Order from "@/models/Order";
import { notifyDeliveryUpdate, notifyOrderUpdate } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/delivery/webhook/kwik
 * Handle Kwik Delivery webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = JSON.stringify(body);
    
    // Verify webhook signature if secret is configured
    const secretKey = process.env.KWIK_WEBHOOK_SECRET || "";
    if (secretKey) {
      const signature = request.headers.get("x-kwik-signature");
      if (!signature || !verifyKwikWebhookSignature(payload, signature, secretKey)) {
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

    // Map Kwik status to our internal status
    const newStatus = mapKwikStatusToOrderStatus(data.status || event);

    // Update order based on event type
    switch (event) {
      case "order.driver_assigned":
      case "order.driver_arrived":
      case "order.picked_up":
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: newStatus,
            "delivery.driver": data.driver ? {
              name: data.driver.name,
              phone: data.driver.phone,
              vehicleType: data.driver.vehicle_type,
              vehicleNumber: data.driver.vehicle_number,
              rating: data.driver.rating,
            } : undefined,
          },
        });
        break;

      case "order.in_transit":
      case "order.near_destination":
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
      case "order.returned":
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

      case "driver.location_updated":
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

      case "price.updated":
        // Handle price updates (surge pricing, etc.)
        if (data.price?.new_total) {
          await Order.findByIdAndUpdate(order._id, {
            $set: {
              "delivery.priceAdjustment": {
                oldAmount: data.price.old_total,
                newAmount: data.price.new_total,
                reason: data.price.reason,
                updatedAt: new Date(),
              },
            },
          });
        }
        break;

      default:
        console.log(`Unhandled Kwik webhook event: ${event}`);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error: any) {
    console.error("Kwik webhook error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
