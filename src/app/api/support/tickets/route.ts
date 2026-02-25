import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { requireAuth } from '@/lib/middleware';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Shop from '@/models/Shop';

export const dynamic = 'force-dynamic';

// POST /api/support/tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const body = await request.json();
      const {
        subject,
        description,
        category = 'general',
        priority = 'medium',
        relatedOrderId,
        relatedProductId,
        relatedShopId,
        attachments = [],
      } = body;

      if (!subject || !description) {
        return NextResponse.json(
          { success: false, message: 'Subject and description are required' },
          { status: 400 }
        );
      }

      // Verify related entities exist and belong to user (for orders)
      let relatedOrder, relatedProduct, relatedShop;

      if (relatedOrderId) {
        relatedOrder = await Order.findById(relatedOrderId);
        if (!relatedOrder) {
          return NextResponse.json(
            { success: false, message: 'Related order not found' },
            { status: 404 }
          );
        }
        // Verify order belongs to user
        if (relatedOrder.buyer.toString() !== user.userId) {
          return NextResponse.json(
            { success: false, message: 'You can only create tickets for your own orders' },
            { status: 403 }
          );
        }
      }

      if (relatedProductId) {
        relatedProduct = await Product.findById(relatedProductId);
        if (!relatedProduct) {
          return NextResponse.json(
            { success: false, message: 'Related product not found' },
            { status: 404 }
          );
        }
      }

      if (relatedShopId) {
        relatedShop = await Shop.findById(relatedShopId);
        if (!relatedShop) {
          return NextResponse.json(
            { success: false, message: 'Related shop not found' },
            { status: 404 }
          );
        }
      }

      // Create ticket with initial message
      const ticket = await SupportTicket.create({
        user: user.userId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        relatedOrder: relatedOrder?._id,
        relatedProduct: relatedProduct?._id,
        relatedShop: relatedShop?._id,
        attachments,
        messages: [
          {
            sender: user.userId,
            senderRole: user.role === 'admin' ? 'admin' : 'user',
            content: description.trim(),
            attachments,
          },
        ],
      });

      // Populate related data for response
      await ticket.populate([
        { path: 'user', select: 'fullName email' },
        { path: 'relatedOrder', select: 'orderNumber status' },
        { path: 'relatedProduct', select: 'title slug' },
        { path: 'relatedShop', select: 'shopName shopSlug' },
      ]);

      return NextResponse.json(
        {
          success: true,
          message: 'Support ticket created successfully',
          data: ticket,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Create ticket error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to create support ticket',
        },
        { status: 500 }
      );
    }
  })(request);
}

// GET /api/support/tickets - List tickets with filters
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();

      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status');
      const category = searchParams.get('category');
      const priority = searchParams.get('priority');
      const search = searchParams.get('search');

      const query: any = {};

      // Regular users can only see their own tickets
      if (user.role !== 'admin' && user.role !== 'seller') {
        query.user = user.userId;
      } else if (user.role === 'admin') {
        // Admins can see all tickets or filter by assignedTo
        const assignedTo = searchParams.get('assignedTo');
        if (assignedTo === 'me') {
          query.assignedTo = user.userId;
        } else if (assignedTo) {
          query.assignedTo = assignedTo;
        }
      }

      // Apply filters
      if (status) {
        query.status = status;
      }
      if (category) {
        query.category = category;
      }
      if (priority) {
        query.priority = priority;
      }
      if (search) {
        query.$or = [
          { subject: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { ticketNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [tickets, total] = await Promise.all([
        SupportTicket.find(query)
          .populate('user', 'fullName email avatar')
          .populate('assignedTo', 'fullName email')
          .populate('relatedOrder', 'orderNumber status')
          .populate('relatedProduct', 'title slug images')
          .populate('relatedShop', 'shopName shopSlug')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SupportTicket.countDocuments(query),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      console.error('Get tickets error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to fetch tickets',
        },
        { status: 500 }
      );
    }
  })(request);
}





