import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/support/tickets/:id - Get ticket details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const ticket = await SupportTicket.findById(params.id)
        .populate('user', 'fullName email avatar')
        .populate('assignedTo', 'fullName email avatar')
        .populate('relatedOrder', 'orderNumber status totals')
        .populate('relatedProduct', 'title slug images price')
        .populate('relatedShop', 'shopName shopSlug logo')
        .populate('messages.sender', 'fullName email avatar')
        .lean();

      if (!ticket) {
        return NextResponse.json(
          { success: false, message: 'Ticket not found' },
          { status: 404 }
        );
      }

      // Check permissions: users can only see their own tickets, admins can see all
      if (user.role !== 'admin' && user.role !== 'seller') {
        if (ticket.user._id.toString() !== user.userId) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 403 }
          );
        }
      }

      // Filter out internal messages for regular users
      if (user.role !== 'admin' && user.role !== 'seller') {
        ticket.messages = ticket.messages.filter((msg: any) => !msg.isInternal);
      }

      return NextResponse.json({
        success: true,
        data: ticket,
      });
    } catch (error: any) {
      console.error('Get ticket error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to fetch ticket',
        },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/support/tickets/:id - Update ticket (status, priority, assignment)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const ticket = await SupportTicket.findById(params.id);

      if (!ticket) {
        return NextResponse.json(
          { success: false, message: 'Ticket not found' },
          { status: 404 }
        );
      }

      // Check permissions
      const isOwner = ticket.user.toString() === user.userId;
      const isAdmin = user.role === 'admin';
      const isAssigned = ticket.assignedTo?.toString() === user.userId;

      if (!isOwner && !isAdmin && !isAssigned) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { status, priority, assignedTo, tags, satisfactionRating, satisfactionFeedback } = body;

      // Users can only update satisfaction rating and close their own tickets
      if (!isAdmin && !isAssigned) {
        if (status && status !== 'closed') {
          return NextResponse.json(
            { success: false, message: 'You can only close your own tickets' },
            { status: 403 }
          );
        }
        if (priority || assignedTo || tags) {
          return NextResponse.json(
            { success: false, message: 'Only admins can update priority, assignment, and tags' },
            { status: 403 }
          );
        }
      }

      // Update fields
      if (status) ticket.status = status;
      if (priority && (isAdmin || isAssigned)) ticket.priority = priority;
      if (assignedTo !== undefined && isAdmin) {
        ticket.assignedTo = assignedTo || null;
      }
      if (tags && (isAdmin || isAssigned)) ticket.tags = tags;
      if (satisfactionRating !== undefined && isOwner) {
        ticket.satisfactionRating = satisfactionRating;
      }
      if (satisfactionFeedback !== undefined && isOwner) {
        ticket.satisfactionFeedback = satisfactionFeedback;
      }

      await ticket.save();

      await ticket.populate([
        { path: 'user', select: 'fullName email avatar' },
        { path: 'assignedTo', select: 'fullName email avatar' },
      ]);

      return NextResponse.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket,
      });
    } catch (error: any) {
      console.error('Update ticket error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to update ticket',
        },
        { status: 500 }
      );
    }
  })(request);
}





