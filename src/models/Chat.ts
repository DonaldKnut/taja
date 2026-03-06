import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'product' | 'order';
  attachments?: string[];
  read: boolean;
  readBy?: Array<{
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  createdAt: Date;
}

export interface IChat extends Document {
  name?: string;
  isGroup?: boolean;
  participants: mongoose.Types.ObjectId[];
  deletedBy: mongoose.Types.ObjectId[]; // Soft delete array
  product?: mongoose.Types.ObjectId;
  shop: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>;
  isParticipant(userId: string): boolean;
  addMessage(
    senderId: string,
    content: string,
    type?: string,
    attachments?: string[]
  ): Promise<void>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'product', 'order'],
      default: 'text',
    },
    attachments: {
      type: [String],
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ChatSchema = new Schema<IChat>(
  {
    name: {
      type: String,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    messages: [MessageSchema],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ChatSchema.index({ participants: 1 });
ChatSchema.index({ shop: 1 });
ChatSchema.index({ lastMessageAt: -1 });

// Method to check if user is a participant
ChatSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some(
    (id: mongoose.Types.ObjectId) => id.toString() === userId
  );
};

// Method to add a message
ChatSchema.methods.addMessage = async function (
  senderId: string,
  content: string,
  type: string = 'text',
  attachments: string[] = []
): Promise<void> {
  const message: IMessage = {
    sender: new mongoose.Types.ObjectId(senderId),
    content,
    type: type as 'text' | 'image' | 'product' | 'order',
    attachments,
    read: false,
    readBy: [],
    createdAt: new Date(),
  };

  this.messages.push(message);
  this.lastMessage = content;
  this.lastMessageAt = new Date();

  // Update unread count for other participants
  this.participants.forEach((participantId: mongoose.Types.ObjectId) => {
    if (participantId.toString() !== senderId) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });

  await this.save();
};

const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;








