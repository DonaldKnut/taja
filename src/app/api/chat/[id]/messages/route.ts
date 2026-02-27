import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// POST /api/chat/:id/messages - Add a message (persisted; use socket for real-time delivery when available)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { content = '', type = 'text', attachments = [] } = body;
      const hasContent = typeof content === 'string' && content.trim().length > 0;
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

      if (!hasContent && !hasAttachments) {
        return NextResponse.json(
          { success: false, message: 'Message content or attachments are required' },
          { status: 400 }
        );
      }

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
          { success: false, message: 'Not allowed to send in this chat' },
          { status: 403 }
        );
      }

      await (chat as any).addMessage(user.userId, hasContent ? content.trim() : (hasAttachments ? '📎 Attachment' : ''), type, attachments || []);

      const updated = await Chat.findById(chat._id).lean();
      const lastMsg = (updated as any).messages[(updated as any).messages.length - 1];

      return NextResponse.json({
        success: true,
        data: {
          _id: lastMsg._id?.toString(),
          sender: lastMsg.sender?.toString(),
          content: lastMsg.content,
          type: lastMsg.type,
          attachments: lastMsg.attachments || [],
          timestamp: lastMsg.createdAt,
          readBy: lastMsg.readBy || [],
        },
      });
    } catch (error: any) {
      console.error('POST /api/chat/[id]/messages error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to send message' },
        { status: 500 }
      );
    }
  })(request);
}
