import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export async function PUT(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const result = await Notification.updateMany(
        { user: user.userId, read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
        data: {
          updatedCount: result.modifiedCount,
        },
      });
    } catch (error: any) {
      console.error('Mark all read error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }
  })(request);
}






