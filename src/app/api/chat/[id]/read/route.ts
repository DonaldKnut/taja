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
      await chat.save();

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('PUT /api/chat/[id]/read error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to mark as read' },
        { status: 500 }
      );
    }
  })(request);
}
