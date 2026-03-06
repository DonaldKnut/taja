import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/chat/:id - Get one chat with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      const chat = await Chat.findById(params.id)
        .populate('participants', 'fullName avatar')
        .populate('product', 'title images price slug')
        .populate('shop', 'shopName shopSlug')
        .lean();

      if (!chat) {
        return NextResponse.json(
          { success: false, message: 'Chat not found' },
          { status: 404 }
        );
      }

      const isParticipant = (chat as any).participants.some(
        (p: any) => p._id?.toString() === user.userId || p.toString() === user.userId
      );
      if (!isParticipant) {
        return NextResponse.json(
          { success: false, message: 'Not allowed to view this chat' },
          { status: 403 }
        );
      }

      const c = chat as any;
      const data = {
        ...c,
        _id: c._id.toString(),
        unreadCount: c.unreadCount instanceof Map ? Object.fromEntries(c.unreadCount) : c.unreadCount || {},
        messages: (c.messages || []).map((m: any) => ({
          _id: m._id?.toString(),
          sender: m.sender?.toString(),
          content: m.content,
          type: m.type,
          attachments: m.attachments || [],
          timestamp: m.createdAt,
          readBy: m.readBy || [],
        })),
      };

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error('GET /api/chat/[id] error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch chat' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/chat/:id - Soft delete a chat for the current user
export async function DELETE(
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
        (p: any) => p._id?.toString() === user.userId || p.toString() === user.userId
      );
      if (!isParticipant && user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Not allowed to modify this chat' },
          { status: 403 }
        );
      }

      // Add user to deletedBy array if not already there
      if (!chat.deletedBy.includes(user.userId)) {
        chat.deletedBy.push(user.userId);
        await chat.save();
      }

      return NextResponse.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error: any) {
      console.error('DELETE /api/chat/[id] error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete chat' },
        { status: 500 }
      );
    }
  })(request);
}
