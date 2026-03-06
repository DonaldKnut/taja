import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { requireRole } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/notifications - Send a notification to a user. Admin only.
 * Body: { userId, title, message, type, priority, link }
 */
export async function POST(request: NextRequest) {
    return requireRole(['admin'])(async () => {
        try {
            const body = await request.json();
            const { userId, title, message, type = 'system', priority = 'normal', link } = body;

            if (!userId || !title || !message) {
                return NextResponse.json(
                    { success: false, message: 'User ID, title, and message are required' },
                    { status: 400 }
                );
            }

            await connectDB();

            const notification = await Notification.create({
                user: userId,
                type,
                title,
                message,
                priority,
                link,
                read: false,
            });

            // Send email to the user if they have an email address
            try {
                const User = require('@/models/User').default;
                const user = await User.findById(userId).select('email fullName');
                if (user && user.email) {
                    const { sendBroadcastEmail } = require('@/lib/email');

                    const htmlMessage = `
                        <h2>New message from Admin</h2>
                        <p>${message}</p>
                        ${link ? `<p><br><a href="${process.env.NEXTAUTH_URL || 'https://tajaapp.shop'}${link}" style="display:inline-block;padding:10px 20px;background-color:#059669;color:white;text-decoration:none;border-radius:8px;">View Notification</a></p>` : ''}
                    `;

                    await sendBroadcastEmail(user.email, title, htmlMessage, user.fullName);
                }
            } catch (emailError) {
                console.error('Failed to send email for admin notification:', emailError);
                // We don't fail the request if just the email fails
            }

            return NextResponse.json({
                success: true,
                message: 'Notification sent successfully',
                data: notification,
            });
        } catch (error: any) {
            console.error('Create notification error:', error);
            return NextResponse.json(
                { success: false, message: error.message || 'Failed to send notification' },
                { status: 500 }
            );
        }
    })(request);
}
