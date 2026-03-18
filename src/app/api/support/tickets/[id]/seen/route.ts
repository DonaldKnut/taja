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
      const seenBy: any[] = (ticket as any).seenBy || [];
      const idx = seenBy.findIndex((s) => String(s.user) === user.userId);
      if (idx >= 0) {
        seenBy[idx].seenAt = now;
      } else {
        seenBy.push({ user: user.userId, seenAt: now });
      }
      (ticket as any).seenBy = seenBy;
      await ticket.save();

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

