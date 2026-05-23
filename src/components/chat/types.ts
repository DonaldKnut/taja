export interface ChatUser {
  _id: string;
  fullName: string;
  avatar?: string;
  isVerified: boolean;
}

export interface ChatMessage {
  _id: string;
  sender: string;
  content: string;
  type: "text" | "image" | "product" | "order";
  attachments?: string[];
  timestamp: Date;
  readBy: Array<{
    user: string;
    readAt: Date;
  }>;
}

export interface ChatThread {
  _id: string;
  name?: string;
  isGroup?: boolean;
  participants: ChatUser[];
  product?: {
    _id: string;
    slug?: string;
    title: string;
    images: string[];
    price: number;
  };
  shop: {
    _id: string;
    shopName: string;
    shopSlug: string;
  };
  messages: ChatMessage[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: { [userId: string]: number };
}
