import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { requireAuth } from "@/lib/middleware";

export const dynamic = "force-dynamic";

// POST /api/support/tickets/:id/seen - Mark ticket as seen by staff/admin
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (_req, user) => {
    try {
      await connectDB();
      const ticket = await SupportTicket.findById(params.id);
      if (!ticket) {
        return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
      }

      const isAdmin = user.role === "admin";
      const isAssigned = ticket.assignedTo?.toString() === user.userId;
      if (!isAdmin && !isAssigned) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
      }

      const now = new Date();

      // Use atomic update operations instead of document.save() to avoid
      // VersionError race conditions when multiple mark-seen calls happen.
      // 1) Try to update existing seenBy entry for this user
      const updateExisting = await SupportTicket.updateOne(
        { _id: ticket._id, "seenBy.user": user.userId },
        { $set: { "seenBy.$.seenAt": now } }
      );

      // 2) If no existing entry was updated, push a new one
      if (updateExisting.modifiedCount === 0) {
        await SupportTicket.updateOne(
          { _id: ticket._id, "seenBy.user": { $ne: user.userId } },
          { $push: { seenBy: { user: user.userId, seenAt: now } } }
        );
      }

      return NextResponse.json({ success: true, data: { seenAt: now } });
    } catch (e: any) {
      console.error("Mark seen error:", e);
      return NextResponse.json(
        { success: false, message: e.message || "Failed to mark seen" },
        { status: 500 }
      );
    }
  })(request);
}

