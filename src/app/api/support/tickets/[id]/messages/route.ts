import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import SupportTicket from '@/models/SupportTicket';
import { requireAuth } from '@/lib/middleware';
import mongoose from 'mongoose';
import { sendSupportTicketNewMessageEmail } from '@/lib/email';
import User from '@/models/User';
import { notifyAdminsSupportTicketMessage } from '@/lib/notifications';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const SUPPORT_BOT_SYSTEM_PROMPT = `
You are Taja Support Bot inside a support ticket thread.
Goal: give a helpful, short, step-by-step response that moves the issue forward.

Rules:
- Keep replies concise (max ~8 short lines).
- Ask 1-2 clarifying questions only when necessary.
- If the user reports payment/escrow/order issues, ask for order number and what they see on screen.
- If you can't resolve, say a human agent will follow up in this thread.
- Never mention internal implementation details.
`.trim();

async function generateSupportBotReply(input: {
  ticketNumber: string;
  subject: string;
  category: string;
  lastUserMessage: string;
  recentConversation: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    systemInstruction: SUPPORT_BOT_SYSTEM_PROMPT,
  });

  const context = `Ticket: ${input.ticketNumber}\nSubject: ${input.subject}\nCategory: ${input.category}`;
  const history = input.recentConversation.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));

  // Gemini requires first message be from user
  const normalizedHistory = [{ role: 'user' as const, parts: [{ text: context }] }, ...history].slice(-12);
  const chat = model.startChat({ history: normalizedHistory.slice(0, -1) });
  const result = await chat.sendMessage(normalizedHistory[normalizedHistory.length - 1].parts[0].text);
  const response = await result.response;
  const reply = response.text()?.trim();
  return reply || null;
}

// POST /api/support/tickets/:id/messages - Add message to ticket
export async function POST(
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

      // Don't allow messages on closed tickets
      if (ticket.status === 'closed') {
        return NextResponse.json(
          { success: false, message: 'Cannot add messages to closed tickets' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { content, attachments = [], isInternal = false } = body;

      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, message: 'Message content is required' },
          { status: 400 }
        );
      }

      // Determine sender role
      const senderRole = user.role === 'admin' ? 'admin' : user.role === 'seller' ? 'seller' : 'user';

      // Only admins/sellers can add internal notes
      if (isInternal && senderRole === 'user') {
        return NextResponse.json(
          { success: false, message: 'Only staff can add internal notes' },
          { status: 403 }
        );
      }

      // Add message
      ticket.messages.push({
        sender: new mongoose.Types.ObjectId(user.userId),
        senderRole,
        content: content.trim(),
        attachments,
        isInternal,
        createdAt: new Date(),
      });

      // Instant auto-ack for end users (system message) to make chat feel responsive.
      // We only do this for non-staff, non-internal messages.
      if (senderRole === 'user' && !isInternal) {
        const recent = (ticket.messages || [])
          .filter((m: any) => !m.isInternal)
          .slice(-8)
          .map((m: any) => ({
            role: m.senderRole === 'admin' || m.senderRole === 'seller' || m.senderRole === 'system' ? ('assistant' as const) : ('user' as const),
            content: String(m.content || ''),
          }));

        const botReply =
          (await generateSupportBotReply({
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            category: ticket.category,
            lastUserMessage: content.trim(),
            recentConversation: recent,
          })) ||
          `Thanks — we’ve received your message on ticket ${ticket.ticketNumber}. A support agent will reply here shortly.\n\nTip: If this is about an order, include the order number and a screenshot to speed things up.`;

        ticket.messages.push({
          senderRole: 'system',
          content: botReply,
          attachments: [],
          isInternal: false,
          createdAt: new Date(),
        } as any);
      }

      // Auto-update status when staff responds
      if (senderRole === 'admin' || senderRole === 'seller') {
        if (ticket.status === 'open' || ticket.status === 'waiting_customer') {
          ticket.status = 'in_progress';
        }
      } else {
        // User response - mark as waiting for customer if it was in progress
        if (ticket.status === 'in_progress') {
          ticket.status = 'waiting_customer';
        }
      }

      await ticket.save();

      // Populate sender info
      await ticket.populate('messages.sender', 'fullName email avatar');

      const newMessage = ticket.messages[ticket.messages.length - 1];

      // Notify admins/assignee when a customer (non-admin) sends a message (ignore internal notes)
      try {
        if (senderRole !== 'admin' && !isInternal) {
          const senderDoc = await User.findById(user.userId).select('fullName email').lean();
          let assignedToEmail: string | null = null;
          let assignedToId: string | null = null;
          if (ticket.assignedTo) {
            const assignedDoc = await User.findById(ticket.assignedTo).select('email').lean();
            assignedToEmail = assignedDoc?.email || null;
            assignedToId = String(ticket.assignedTo);
          }
          await sendSupportTicketNewMessageEmail({
            ticketId: String(ticket._id),
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            messagePreview: String(content).slice(0, 400),
            senderName: senderDoc?.fullName,
            senderEmail: senderDoc?.email,
            assignedToEmail,
          });
          await notifyAdminsSupportTicketMessage({
            ticketId: String(ticket._id),
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            senderName: senderDoc?.fullName,
            preview: String(content).slice(0, 180),
            assignedToId,
          });
        }
      } catch (e) {
        console.error('Support ticket message email notify failed:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Message added successfully',
        data: newMessage,
      });
    } catch (error: any) {
      console.error('Add message error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to add message',
        },
        { status: 500 }
      );
    }
  })(request);
}





