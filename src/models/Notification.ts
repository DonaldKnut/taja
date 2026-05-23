import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'order'
  | 'message'
  | 'review'
  | 'payment'
  | 'system'
  | 'promotion'
  | 'chat'
  | 'shop';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actionUrl?: string;
  read: boolean;
  priority?: NotificationPriority;
  imageUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['order', 'message', 'review', 'payment', 'system', 'promotion', 'chat', 'shop'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    actionUrl: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    imageUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

// Static method to mark all notifications as read for a user
NotificationSchema.statics.markAllAsRead = async function (userId: string) {
  return this.updateMany(
    { user: userId, read: false },
    { $set: { read: true } }
  );
};

const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;








