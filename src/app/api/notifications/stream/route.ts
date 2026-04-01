import { NextRequest } from "next/server";
import { authenticate } from "@/lib/middleware";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/stream
 * Server-Sent Events stream for live notifications
 */
export async function GET(request: NextRequest) {
    const auth = await authenticate(request);
    if (!auth.authenticated) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = auth.user.userId;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            await connectDB();

            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

            let lastChecked = new Date();

            // Poll interval - 5 seconds
            const interval = setInterval(async () => {
                try {
                    const newNotifications = await Notification.find({
                        user: userId,
                        createdAt: { $gt: lastChecked },
                    }).sort({ createdAt: -1 });

                    if (newNotifications.length > 0) {
                        lastChecked = newNotifications[0].createdAt;
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: "new_notifications", count: newNotifications.length })}\n\n`)
                        );
                    } else {
                        // Keep-alive heartbeat
                        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
                    }
                } catch (error) {
                    console.error("SSE Streaming error:", error);
                }
            }, 5000);

            // Clean up on close
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
