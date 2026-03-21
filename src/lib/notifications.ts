/**
 * Notification helper functions
 * Use these to create notifications from anywhere in the backend
 */

import Notification from '@/models/Notification';
import connectDB from './db';

interface CreateNotificationParams {
  userId: string;
  type: 'order' | 'message' | 'review' | 'payment' | 'system' | 'promotion' | 'chat' | 'shop';
  title: string;
  message: string;
  link?: string;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  imageUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 * This will also emit a real-time notification via Socket.io if available
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectDB();

    const notification = await Notification.create({
      user: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      actionUrl: params.actionUrl,
      priority: params.priority || 'normal',
      imageUrl: params.imageUrl,
      metadata: params.metadata || {},
      read: false,
    });

    // Emit real-time notification via Socket.io if available
    try {
      // Try to get the socket.io instance from the global scope
      // This assumes Socket.io is set up in your Next.js API routes
      const io = (global as any).io;
      if (io && io.emitNotification) {
        io.emitNotification(params.userId, notification.toObject());
      }
    } catch (socketError) {
      // Socket.io not available, continue without real-time
      console.log('Socket.io not available for real-time notification');
    }

    return notification;
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create notification for order updates
 */
export async function notifyOrderUpdate(
  userId: string,
  orderNumber: string,
  status: string,
  orderId?: string
) {
  const statusMessages: Record<string, { title: string; message: string }> = {
    confirmed: {
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed and is being processed.`,
    },
    processing: {
      title: 'Order Processing',
      message: `Your order ${orderNumber} is being prepared for shipment.`,
    },
    shipped: {
      title: 'Order Shipped',
      message: `Your order ${orderNumber} has been shipped! Track your delivery.`,
    },
    delivered: {
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered. Enjoy your purchase!`,
    },
    completed: {
      title: 'Order Completed',
      message: `Your order ${orderNumber} has been completed. Thank you for shopping!`,
    },
    cancelled: {
      title: 'Order Cancelled',
      message: `Your order ${orderNumber} has been cancelled.`,
    },
    disputed: {
      title: 'Order Disputed',
      message: `A dispute has been opened for order ${orderNumber}. Our team will review it.`,
    },
  };

  const statusInfo = statusMessages[status] || {
    title: 'Order Update',
    message: `Your order ${orderNumber} status has been updated to ${status}.`,
  };

  return createNotification({
    userId,
    type: 'order',
    title: statusInfo.title,
    message: statusInfo.message,
    link: orderId ? `/dashboard/orders/${orderId}` : '/dashboard/orders',
    priority: status === 'delivered' ? 'high' : 'normal',
  });
}

/**
 * Notify all admin users when a new shop is registered (potential seller under review).
 * Each admin gets an in-app notification so they can see and act on it.
 */
export async function notifyAdminsNewShop(params: {
  shopId: string;
  shopName: string;
  shopSlug: string;
  ownerName: string;
  ownerEmail: string;
}) {
  const { shopId, shopName, shopSlug, ownerName, ownerEmail } = params;
  await connectDB();
  const User = (await import('@/models/User')).default;
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
  const actionUrl = `${baseUrl}/admin/kyc?tab=shops`;

  for (const admin of admins) {
    await createNotification({
      userId: admin._id.toString(),
      type: 'shop',
      title: 'New shop registered',
      message: `${shopName} by ${ownerName} (${ownerEmail}) has registered and is under review.`,
      link: actionUrl,
      actionUrl,
      priority: 'high',
      metadata: { shopId, shopName, shopSlug, ownerName, ownerEmail },
    });
  }
}

/**
 * Notify all admins when a new support ticket is created.
 */
export async function notifyAdminsNewSupportTicket(params: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  requesterName?: string;
}) {
  try {
    await connectDB();
    const User = (await import('@/models/User')).default;
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
    const actionUrl = `${baseUrl}/admin/support/tickets/${params.ticketId}`;
    const message = `${params.requesterName || 'A user'} created ticket #${params.ticketNumber}: ${params.subject}`;

    for (const admin of admins) {
      await createNotification({
        userId: admin._id.toString(),
        type: 'system',
        title: 'New support ticket',
        message,
        link: actionUrl,
        actionUrl,
        priority: 'high',
        metadata: params,
      });
    }
  } catch (err: any) {
    console.error('Failed to notify admins of new support ticket:', err);
  }
}

/**
 * Notify admins (and assignee if provided) on new customer message.
 */
export async function notifyAdminsSupportTicketMessage(params: {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  senderName?: string;
  preview: string;
  assignedToId?: string | null;
}) {
  try {
    await connectDB();
    const User = (await import('@/models/User')).default;
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
    const actionUrl = `${baseUrl}/admin/support/tickets/${params.ticketId}`;

    const recipients: string[] = [];
    if (params.assignedToId) recipients.push(params.assignedToId);
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    for (const admin of admins) recipients.push(admin._id.toString());

    const uniq = Array.from(new Set(recipients));
    const message = `${params.senderName || 'Customer'}: ${params.preview}`;

    for (const userId of uniq) {
      await createNotification({
        userId,
        type: 'system',
        title: `Support: ${params.ticketNumber}`,
        message,
        link: actionUrl,
        actionUrl,
        priority: 'high',
        metadata: params,
      });
    }
  } catch (err: any) {
    console.error('Failed to notify admins of support ticket message:', err);
  }
}

/**
 * Notify all admins when a new order is placed (buyer bought from seller).
 * Admin can follow the process: order → payment → escrow → delivery → release.
 */
export async function notifyAdminsNewOrder(params: {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail?: string;
  shopName?: string;
  sellerName?: string;
  totalNaira: number;
}) {
  try {
    await connectDB();
    const User = (await import('@/models/User')).default;
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
    const actionUrl = `${baseUrl}/admin/orders`;

    const { orderId, orderNumber, buyerName, shopName, sellerName, totalNaira } = params;
    const sellerShop = [shopName, sellerName].filter(Boolean).join(' · ') || 'Seller';
    const message = `${buyerName} placed order #${orderNumber} (₦${totalNaira.toLocaleString()}) from ${sellerShop}. Track payment and escrow to ensure a fair outcome.`;

    for (const admin of admins) {
      await createNotification({
        userId: admin._id.toString(),
        type: 'order',
        title: 'New order placed',
        message,
        link: actionUrl,
        actionUrl,
        priority: 'high',
        metadata: { ...params },
      });
    }
  } catch (err: any) {
    console.error('Failed to notify admins of new order:', err);
  }
}

/**
 * Notify all admins when payment is received and funds are held in escrow.
 * Admin can ensure delivery and release when appropriate.
 */
export async function notifyAdminsPaymentReceived(params: {
  orderId: string;
  orderNumber: string;
  totalNaira: number;
}) {
  try {
    await connectDB();
    const User = (await import('@/models/User')).default;
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tajaapp.shop';
    const actionUrl = `${baseUrl}/admin/orders`;

    const { orderNumber, totalNaira } = params;
    const message = `Order #${orderNumber}: ₦${totalNaira.toLocaleString()} paid and held in escrow. Monitor delivery and release when the buyer confirms.`;

    for (const admin of admins) {
      await createNotification({
        userId: admin._id.toString(),
        type: 'payment',
        title: 'Payment received – funds in escrow',
        message,
        link: actionUrl,
        actionUrl,
        priority: 'high',
        metadata: params,
      });
    }
  } catch (err: any) {
    console.error('Failed to notify admins of payment received:', err);
  }
}

/**
 * Create notification for new messages
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  messagePreview: string,
  chatId: string
) {
  return createNotification({
    userId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: messagePreview,
    link: `/chat/${chatId}`,
    priority: 'high',
  });
}

/**
 * Create notification for payment updates
 */
export async function notifyPaymentUpdate(
  userId: string,
  orderNumber: string,
  status: 'paid' | 'failed' | 'refunded',
  orderId?: string
) {
  const statusMessages: Record<string, { title: string; message: string }> = {
    paid: {
      title: 'Payment Successful',
      message: `Payment for order ${orderNumber} was successful.`,
    },
    failed: {
      title: 'Payment Failed',
      message: `Payment for order ${orderNumber} failed. Please try again.`,
    },
    refunded: {
      title: 'Payment Refunded',
      message: `Your payment for order ${orderNumber} has been refunded.`,
    },
  };

  const statusInfo = statusMessages[status] || {
    title: 'Payment Update',
    message: `Payment status for order ${orderNumber} has been updated.`,
  };

  return createNotification({
    userId,
    type: 'payment',
    title: statusInfo.title,
    message: statusInfo.message,
    link: orderId ? `/dashboard/orders/${orderId}` : '/dashboard/orders',
    priority: status === 'failed' ? 'urgent' : 'normal',
  });
}

/**
 * Create notification for delivery updates
 */
export async function notifyDeliveryUpdate(
  userId: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string,
  orderId?: string
) {
  const statusMessages: Record<string, { title: string; message: string }> = {
    processing: {
      title: 'Delivery Initiated',
      message: `Your order ${orderNumber} is being prepared for delivery.${trackingNumber ? ` Track: ${trackingNumber}` : ''}`,
    },
    shipped: {
      title: 'Order Shipped',
      message: `Your order ${orderNumber} has been shipped and is on its way!${trackingNumber ? ` Track: ${trackingNumber}` : ''}`,
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      message: `Your order ${orderNumber} is out for delivery and will arrive soon!`,
    },
    delivered: {
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered. Please confirm receipt.`,
    },
    delivery_failed: {
      title: 'Delivery Failed',
      message: `We couldn't deliver your order ${orderNumber}. Our team will contact you.`,
    },
  };

  const statusInfo = statusMessages[status] || {
    title: 'Delivery Update',
    message: `Your order ${orderNumber} delivery status has been updated to ${status}.`,
  };

  return createNotification({
    userId,
    type: 'order',
    title: statusInfo.title,
    message: statusInfo.message,
    link: orderId ? `/dashboard/orders/${orderId}` : `/dashboard/orders`,
    priority: status === 'delivered' || status === 'delivery_failed' ? 'high' : 'normal',
    metadata: trackingNumber ? { trackingNumber } : undefined,
  });
}

/**
 * Notify an owner that someone viewed their product/shop.
 * Deduplicates by owner + entity + viewer key within a cooldown window.
 */
export async function notifyOwnerViewAlert(params: {
  ownerUserId: string;
  entityType: 'product' | 'shop';
  entityId: string;
  entityName?: string;
  entitySlug?: string;
  viewerName?: string;
  viewerKey: string;
  cooldownMinutes?: number;
}) {
  const {
    ownerUserId,
    entityType,
    entityId,
    entityName,
    entitySlug,
    viewerName,
    viewerKey,
    cooldownMinutes = 180,
  } = params;

  try {
    await connectDB();

    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    const recent = await Notification.findOne({
      user: ownerUserId,
      type: 'shop',
      'metadata.event': 'profile_view',
      'metadata.entityType': entityType,
      'metadata.entityId': entityId,
      'metadata.viewerKey': viewerKey,
      createdAt: { $gte: cutoff },
    })
      .select('_id')
      .lean();

    if (recent) return null;

    const actor = viewerName?.trim() ? viewerName.trim() : 'Someone';
    const noun = entityType === 'product' ? 'product' : 'shop';
    const title = entityType === 'product' ? 'Product viewed' : 'Shop discovered';
    const readableName = entityName?.trim() || `your ${noun}`;
    const message = `${actor} viewed ${readableName}. Your listing is getting attention.`;
    const link =
      entityType === 'product' && entitySlug
        ? `/seller/products`
        : entityType === 'shop'
          ? `/seller/dashboard`
          : '/seller';

    return createNotification({
      userId: ownerUserId,
      type: 'shop',
      title,
      message,
      link,
      actionUrl: link,
      priority: 'normal',
      metadata: {
        event: 'profile_view',
        entityType,
        entityId,
        entitySlug,
        viewerKey,
      },
    });
  } catch (error: any) {
    console.error('Failed to notify owner about view:', error);
    return null;
  }
}

/**
 * Notify seller that a product received a new like/wishlist.
 * Deduplicates per seller + product + liker key within a cooldown window.
 */
export async function notifySellerProductLiked(params: {
  sellerUserId: string;
  productId: string;
  productTitle?: string;
  likerName?: string;
  likerKey: string;
  likesCount?: number;
  cooldownMinutes?: number;
}) {
  const {
    sellerUserId,
    productId,
    productTitle,
    likerName,
    likerKey,
    likesCount,
    cooldownMinutes = 1440, // 24h per liker to avoid notification spam
  } = params;

  try {
    await connectDB();

    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    const recent = await Notification.findOne({
      user: sellerUserId,
      type: 'shop',
      'metadata.event': 'product_like',
      'metadata.productId': productId,
      'metadata.likerKey': likerKey,
      createdAt: { $gte: cutoff },
    })
      .select('_id')
      .lean();

    if (recent) return null;

    const actor = likerName?.trim() ? likerName.trim() : 'Someone';
    const suffix =
      typeof likesCount === 'number' && likesCount >= 0
        ? ` (${likesCount} total likes)`
        : '';

    return createNotification({
      userId: sellerUserId,
      type: 'shop',
      title: 'New product like',
      message: `${actor} liked ${productTitle || 'your product'}${suffix}.`,
      link: '/seller/products',
      actionUrl: '/seller/products',
      priority: 'normal',
      metadata: {
        event: 'product_like',
        productId,
        likerKey,
        likesCount,
      },
    });
  } catch (error: any) {
    console.error('Failed to notify seller about product like:', error);
    return null;
  }
}






