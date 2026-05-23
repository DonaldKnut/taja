import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// PUT /api/chat/:id/read - Mark chat as read for current user (reset unread count)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      const chat = await Chat.findById(params.id);

      if (!chat) {
        return NextResponse.json(
          { success: false, message: 'Chat not found' },
          { status: 404 }
        );
      }

      const isParticipant = (chat as any).participants.some(
        (p: mongoose.Types.ObjectId) => p.toString() === user.userId
      );
      if (!isParticipant) {
        return NextResponse.json(
          { success: false, message: 'Not allowed' },
          { status: 403 }
        );
      }

      const unreadCount = (chat as any).unreadCount || new Map();
      unreadCount.set(user.userId, 0);
      (chat as any).unreadCount = unreadCount;

      // Mark unread messages as read for this user (except messages sent by self).
      // Prevent duplicate readBy entries.
      const now = new Date();
      let updatedMessages = 0;
      for (const msg of (chat as any).messages || []) {
        const senderId = msg?.sender?.toString?.() || String(msg?.sender || '');
        if (!senderId || senderId === user.userId) continue;
        const alreadyReadByUser = (msg.readBy || []).some(
          (entry: any) => entry?.user?.toString?.() === user.userId
        );
        if (!alreadyReadByUser) {
          msg.readBy = [...(msg.readBy || []), { user: user.userId, readAt: now }];
          msg.read = true;
          updatedMessages += 1;
        }
      }

      await chat.save();

      // Best-effort real-time event for clients to update read receipts instantly.
      // Socket server may not run in the same process in some deployments.
      try {
        const io = (globalThis as any).__io;
        if (io && typeof io.emitToChat === 'function') {
          io.emitToChat(params.id, 'messages_read', {
            chatId: params.id,
            userId: user.userId,
            readAt: now.toISOString(),
          });
        }
      } catch {
        // Non-fatal: REST response remains source of truth.
      }

      return NextResponse.json({
        success: true,
        data: {
          chatId: params.id,
          userId: user.userId,
          readAt: now.toISOString(),
          updatedMessages,
        },
      });
    } catch (error: any) {
      console.error('PUT /api/chat/[id]/read error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to mark as read' },
        { status: 500 }
      );
    }
  })(request);
}
