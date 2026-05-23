import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const searchParams = req.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const unreadOnly = searchParams.get('unread') === 'true';
      const type = searchParams.get('type');

      const query: any = { user: user.userId };
      if (unreadOnly) {
        query.read = false;
      }
      if (type) {
        query.type = type;
      }

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ user: user.userId, read: false }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
          unreadCount,
        },
      });
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/notifications - Create notification (for admin/system use)
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { userId, type, title, message, link, actionUrl, priority, imageUrl, metadata } = body;

      // Only allow admins or system to create notifications
      // For now, allow users to create their own (can be restricted later)
      const targetUserId = userId || user.userId;

      if (!type || !title || !message) {
        return NextResponse.json(
          { success: false, message: 'Type, title, and message are required' },
          { status: 400 }
        );
      }

      await connectDB();

      const notification = await Notification.create({
        user: targetUserId,
        type,
        title,
        message,
        link,
        actionUrl,
        priority: priority || 'normal',
        imageUrl,
        metadata: metadata || {},
        read: false,
      });

      return NextResponse.json({
        success: true,
        message: 'Notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Create notification error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create notification' },
        { status: 500 }
      );
    }
  })(request);
}






