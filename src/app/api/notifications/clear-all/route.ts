import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// DELETE /api/notifications/clear-all - Delete all notifications for the current user
export async function DELETE(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const result = await Notification.deleteMany({ user: user.userId });

      return NextResponse.json({
        success: true,
        message: 'All notifications cleared',
        data: { deletedCount: result.deletedCount },
      });
    } catch (error: any) {
      console.error('Clear all notifications error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to clear notifications' },
        { status: 500 }
      );
    }
  })(request);
}
