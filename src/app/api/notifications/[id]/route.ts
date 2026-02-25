import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// PUT /api/notifications/[id] - Mark notification as read/unread
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const { read } = body;

      const notification = await Notification.findOne({
        _id: params.id,
        user: user.userId,
      });

      if (!notification) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }

      if (read !== undefined) {
        notification.read = read;
        await notification.save();
      }

      return NextResponse.json({
        success: true,
        message: 'Notification updated successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Update notification error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update notification' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const notification = await Notification.findOneAndDelete({
        _id: params.id,
        user: user.userId,
      });

      if (!notification) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to delete notification' },
        { status: 500 }
      );
    }
  })(request);
}






