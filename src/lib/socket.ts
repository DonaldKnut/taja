import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import User from '@/models/User';

interface AuthenticatedSocket {
  userId?: string;
  user?: any;
}

export const setupSocketIO = (io: SocketIOServer) => {
  // Expose io for API routes that need best-effort event emits.
  (globalThis as any).__io = io;

  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      await connectDB();
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: any) => {
    console.log(`User ${socket.user.fullName} connected: ${socket.id}`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Join user to their shop room if they're a seller
    if (socket.user.role === 'seller') {
      socket.join(`seller_${socket.userId}`);
    }

    // Chat events
    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    socket.on(
      'send_message',
      async (data: {
        chatId: string;
        content: string;
        type?: string;
        attachments?: string[];
      }) => {
        try {
          const Chat = (await import('@/models/Chat')).default;
          await connectDB();
          const chat = await Chat.findById(data.chatId);

          const isParticipant = chat.participants.some(
            (p: any) => p.toString() === socket.userId
          );
          if (chat && isParticipant) {
            chat.messages.push({
              sender: socket.userId,
              content: data.content,
              type: (data.type || 'text') as 'text' | 'image' | 'product' | 'order',
              attachments: data.attachments || [],
              read: false,
              readBy: [],
              createdAt: new Date(),
            });
            chat.lastMessage = data.content;
            chat.lastMessageAt = new Date();
            await chat.save();

            const lastMsg = chat.messages[chat.messages.length - 1];
            const payload = {
              chatId: data.chatId,
              message: {
                _id: (lastMsg as any)._id?.toString(),
                sender: socket.userId,
                content: data.content,
                type: data.type || 'text',
                attachments: data.attachments || [],
                timestamp: (lastMsg as any).createdAt,
              },
            };
            socket.to(`chat_${data.chatId}`).emit('new_message', payload);
            socket.emit('new_message', payload);
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    socket.on('typing_start', (chatId: string) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.fullName,
      });
    });

    socket.on('typing_stop', (chatId: string) => {
      socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
      });
    });

    // Order events
    socket.on('track_order', (orderId: string) => {
      socket.join(`order_${orderId}`);
      console.log(`User ${socket.userId} tracking order ${orderId}`);
    });

    // Notification events
    socket.on('mark_notifications_read', async () => {
      try {
        const Notification = (await import('@/models/Notification')).default;
        await connectDB();
        await Notification.updateMany(
          { user: socket.userId, read: false },
          { $set: { read: true } }
        );
        socket.emit('notifications_marked_read');
      } catch (error) {
        socket.emit('error', {
          message: 'Failed to mark notifications as read',
        });
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.fullName} disconnected: ${socket.id}`);
    });
  });

  // Helper functions to emit events from other parts of the application
  const emitToUser = (userId: string, event: string, data: any) => {
    io.to(`user_${userId}`).emit(event, data);
  };

  const emitToChat = (chatId: string, event: string, data: any) => {
    io.to(`chat_${chatId}`).emit(event, data);
  };

  const emitToOrder = (orderId: string, event: string, data: any) => {
    io.to(`order_${orderId}`).emit(event, data);
  };

  const emitNotification = (userId: string, notification: any) => {
    io.to(`user_${userId}`).emit('new_notification', notification);
  };

  // Attach helper functions to io instance for use in other modules
  (io as any).emitToUser = emitToUser;
  (io as any).emitToChat = emitToChat;
  (io as any).emitToOrder = emitToOrder;
  (io as any).emitNotification = emitNotification;

  return io;
};








