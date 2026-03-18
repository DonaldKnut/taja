import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { requireAuth } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// POST /api/support/chat-thread - Find or create a "support chat" ticket thread for the current user
export async function POST(request: NextRequest) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();

      const tag = "chat_thread";

      const existing = await SupportTicket.findOne({
        user: user.userId,
        status: { $ne: "closed" },
        tags: tag,
      })
        .sort({ updatedAt: -1 })
        .select("_id status ticketNumber subject updatedAt");

      if (existing) {
        return NextResponse.json({ success: true, data: { ticketId: existing._id } });
      }

      const ticket = await SupportTicket.create({
        user: user.userId,
        subject: "Support Chat",
        description: "Support chat thread",
        category: "general",
        priority: "medium",
        status: "open",
        tags: [tag],
        messages: [],
      });

      return NextResponse.json({ success: true, data: { ticketId: ticket._id } }, { status: 201 });
    } catch (error: any) {
      console.error("Create chat thread error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Failed to create chat thread" },
        { status: 500 }
      );
    }
  })(request);
}

