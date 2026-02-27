import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Chat from '@/models/Chat';
import Product from '@/models/Product';
import Shop from '@/models/Shop';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

// GET /api/chat - List all chats for the current user
export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await connectDB();
      const chats = await Chat.find({
        participants: user.userId,
      })
        .populate('participants', 'fullName avatar')
        .populate('product', 'title images price slug')
        .populate('shop', 'shopName shopSlug')
        .sort({ lastMessageAt: -1 })
        .lean();

      // Map unreadCount (Map) to plain object for JSON
      const data = chats.map((c: any) => ({
        ...c,
        _id: c._id.toString(),
        unreadCount: c.unreadCount instanceof Map
          ? Object.fromEntries(c.unreadCount)
          : c.unreadCount || {},
        messages: (c.messages || []).map((m: any) => ({
          _id: m._id?.toString(),
          sender: m.sender?.toString(),
          content: m.content,
          type: m.type,
          attachments: m.attachments || [],
          timestamp: m.createdAt,
          readBy: m.readBy || [],
        })),
      }));

      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error('GET /api/chat error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to fetch chats' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/chat - Create or get existing chat (buyer + seller, optional product/shop)
export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { sellerId, productId, shopId } = body;

      if (!sellerId) {
        return NextResponse.json(
          { success: false, message: 'sellerId is required' },
          { status: 400 }
        );
      }

      await connectDB();

      let shop = shopId ? await Shop.findById(shopId) : null;
      let product = productId ? await Product.findById(productId).select('shop title images price slug').lean() : null;
      if (product && !shop && (product as any).shop) {
        shop = await Shop.findById((product as any).shop);
      }
      if (!shop && product) {
        shop = await Shop.findOne({ _id: (product as any).shop });
      }
      if (!shop) {
        const sellerShop = await Shop.findOne({ owner: sellerId });
        shop = sellerShop;
      }
      if (!shop) {
        return NextResponse.json(
          { success: false, message: 'Could not determine shop for this chat' },
          { status: 400 }
        );
      }

      const participantIds = [user.userId, sellerId].sort();
      let chat = await Chat.findOne({
        participants: { $all: participantIds },
        shop: shop._id,
      })
        .populate('participants', 'fullName avatar')
        .populate('product', 'title images price slug')
        .populate('shop', 'shopName shopSlug')
        .lean();

      if (!chat) {
        const newChat = await Chat.create({
          participants: participantIds,
          product: productId || undefined,
          shop: shop._id,
          messages: [],
          lastMessageAt: new Date(),
        });
        chat = await Chat.findById(newChat._id)
          .populate('participants', 'fullName avatar')
          .populate('product', 'title images price slug')
          .populate('shop', 'shopName shopSlug')
          .lean();
      }

      const c = chat as any;
      const out = {
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

      return NextResponse.json({ success: true, data: out });
    } catch (error: any) {
      console.error('POST /api/chat error:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create or get chat' },
        { status: 500 }
      );
    }
  })(request);
}
