"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Send,
  Paperclip,
  Search,
  Info,
  ArrowLeft,
  MessageCircle,
  CheckCheck,
  Shield,
  AlertTriangle,
  X,
  Check,
  Store,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, api, uploadProductImage } from "@/lib/api";

// Smart pattern detection for suspicious content (warns, doesn't block)
const detectSuspiciousPatterns = (
  text: string,
): {
  detected: boolean;
  type: string;
  confidence: number;
} => {
  const patterns = [
    { regex: /\b\d{10,}\b/g, type: "Account Number", confidence: 0.9 },
    {
      regex: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      type: "Phone Number",
      confidence: 0.85,
    },
    {
      regex: /\b(account|acct|acc)\s*(number|no|#)?\s*:?\s*\d+/gi,
      type: "Account Info",
      confidence: 0.95,
    },
    {
      regex: /\b(pay|send|transfer)\s+(to|me|direct|outside|offline)\b/gi,
      type: "Direct Payment Request",
      confidence: 0.75,
    },
    {
      regex: /\b(whatsapp|telegram|call\s+me|dm\s+me|text\s+me)\b/gi,
      type: "External Contact",
      confidence: 0.65,
    },
    {
      regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      type: "Card Number",
      confidence: 0.95,
    },
    {
      regex:
        /\b(bank|routing|swift|iban|bvn|sort\s+code)\s*(number|no|code)?\s*:?\s*\d+/gi,
      type: "Banking Details",
      confidence: 0.92,
    },
    {
      regex: /\b(cash|meet|in\s+person|hand\s+to\s+hand)\b/gi,
      type: "Offline Transaction",
      confidence: 0.6,
    },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return {
        detected: true,
        type: pattern.type,
        confidence: pattern.confidence,
      };
    }
  }

  return { detected: false, type: "", confidence: 0 };
};

interface User {
  _id: string;
  fullName: string;
  avatar?: string;
  isVerified: boolean;
}

interface Message {
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

interface Chat {
  _id: string;
  participants: User[];
  product?: {
    _id: string;
    title: string;
    images: string[];
    price: number;
  };
  shop: {
    _id: string;
    shopName: string;
    shopSlug: string;
  };
  messages: Message[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: { [userId: string]: number };
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  // Mobile: show chat list vs conversation
  const [showChatList, setShowChatList] = useState(true);

  // Security features
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningDetails, setWarningDetails] = useState({
    type: "",
    confidence: 0,
  });
  const [pendingMessage, setPendingMessage] = useState("");
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchChats = useCallback(async () => {
    try {
      const response = await api("/api/chat");
      const data = response as { success?: boolean; data?: Chat[] };
      if (data?.success && Array.isArray(data.data)) {
        setChats(data.data);
        if (data.data.length > 0 && !selectedChat) {
          // On desktop, auto-select first chat. On mobile, show list.
          if (window.innerWidth >= 768) {
            setSelectedChat(data.data[0]);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch {
        setCurrentUser(null);
      }
    }

    const token = localStorage.getItem("token");
    if (token) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL, {
        auth: { token },
      });
      setSocket(newSocket);

      newSocket.on(
        "new_message",
        (data: { chatId: string; message: Message }) => {
          const msg = {
            ...data.message,
            _id: data.message._id || `tmp-${Date.now()}`,
            attachments: data.message.attachments || [],
            timestamp: data.message.timestamp
              ? new Date(data.message.timestamp)
              : new Date(),
          };
          setChats((prev) =>
            prev.map((chat) =>
              chat._id === data.chatId
                ? {
                  ...chat,
                  messages: [...chat.messages, msg],
                  lastMessage: msg.content,
                  lastMessageAt: msg.timestamp,
                }
                : chat,
            ),
          );
          setSelectedChat((prev) =>
            prev?._id === data.chatId
              ? {
                ...prev,
                messages: [...prev.messages, msg],
                lastMessage: msg.content,
                lastMessageAt: msg.timestamp,
              }
              : prev,
          );
        },
      );

      newSocket.on("user_typing", (data) => {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      });

      newSocket.on("user_stopped_typing", (data) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      return () => {
        newSocket.close();
      };
    }
  }, []);

  useEffect(() => {
    const sellerId = searchParams.get("seller");
    const productId = searchParams.get("product");
    const shopId = searchParams.get("shopId");
    if (sellerId && currentUser) {
      (async () => {
        try {
          const res = (await api("/api/chat", {
            method: "POST",
            body: JSON.stringify({
              sellerId,
              productId: productId || undefined,
              shopId: shopId || undefined,
            }),
          })) as { success?: boolean; data?: Chat };
          if (res?.success && res?.data) {
            setChats((prev) => {
              const exists = prev.some((c) => c._id === res.data!._id);
              if (exists)
                return prev.map((c) =>
                  c._id === res.data!._id ? res.data! : c,
                );
              return [res.data!, ...prev];
            });
            setSelectedChat(res.data!);
            setShowChatList(false); // On mobile, jump straight to conversation
          }
        } catch (e) {
          toast.error("Could not start conversation");
        }
      })();
    }
    fetchChats();
  }, [
    currentUser?._id,
    searchParams.get("seller"),
    searchParams.get("product"),
    searchParams.get("shopId"),
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (forceBypassWarning = false) => {
    const hasText = message.trim().length > 0;
    const hasAttachments = pendingAttachments.length > 0;
    if ((!hasText && !hasAttachments) || !selectedChat || sending) return;

    // Smart detection - only if not already warned
    if (hasText && !forceBypassWarning) {
      const detection = detectSuspiciousPatterns(message);

      // Only warn if confidence is high enough (60%+)
      if (detection.detected && detection.confidence > 0.6) {
        setPendingMessage(message);
        setWarningDetails({
          type: detection.type,
          confidence: detection.confidence,
        });
        setShowWarningModal(true);
        return; // Stop here and show modal
      }
    }

    setSending(true);
    const messageText =
      message.trim() || (hasAttachments ? "📎 Attachment" : "");
    const attachments = [...pendingAttachments];
    setMessage("");
    setPendingAttachments([]);

    try {
      if (socket?.connected) {
        socket.emit("send_message", {
          chatId: selectedChat._id,
          content: messageText,
          type: hasAttachments ? "image" : "text",
          attachments: attachments.length ? attachments : undefined,
        });
      } else {
        const res = (await api(`/api/chat/${selectedChat._id}/messages`, {
          method: "POST",
          body: JSON.stringify({
            content: messageText,
            type: hasAttachments ? "image" : "text",
            attachments: attachments.length ? attachments : undefined,
          }),
        })) as { success?: boolean; data?: Message };
        if (res?.success && res?.data) {
          const msg = {
            ...res.data,
            attachments: (res.data as any).attachments || [],
            timestamp: new Date((res.data as any).timestamp || Date.now()),
          };
          setSelectedChat((prev) =>
            prev ? { ...prev, messages: [...prev.messages, msg] } : null,
          );
          setChats((prev) =>
            prev.map((c) =>
              c._id === selectedChat._id
                ? {
                  ...c,
                  messages: [...c.messages, msg],
                  lastMessage: messageText,
                  lastMessageAt: msg.timestamp,
                }
                : c,
            ),
          );
        } else {
          toast.error("Failed to send message");
          setMessage(messageText);
          setPendingAttachments(attachments);
        }
      }
    } catch (error) {
      toast.error("Failed to send message");
      setMessage(messageText);
      setPendingAttachments(attachments);
    } finally {
      setSending(false);
    }
  };

  const handleSendWithWarning = () => {
    setShowWarningModal(false);
    setMessage(pendingMessage);
    setPendingMessage("");
    setTimeout(() => sendMessage(true), 100);
  };

  const handleCancelWarning = () => {
    setShowWarningModal(false);
    setPendingMessage("");
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || uploadingAttachment) return;
    setUploadingAttachment(true);
    try {
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          toast.error("Only images are supported for now");
          continue;
        }
        const url = await uploadProductImage(file);
        setPendingAttachments((prev) => [...prev, url]);
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploadingAttachment(false);
      e.target.value = "";
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      await api(`/api/chat/${chatId}/read`, { method: "PUT" });
    } catch {
      // Silent fail
    }
  };

  const formatMessageTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const timeStr = format(d, "h:mm a");
    if (isToday(d)) return timeStr;
    if (isYesterday(d)) return `Yesterday ${timeStr}`;
    return format(d, "MMM d, h:mm a");
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setShowChatList(false); // On mobile, switch to conversation view
    if (socket) {
      socket.emit("join_chat", chat._id);
    }
    markAsRead(chat._id);
  };

  const handleBackToList = () => {
    setShowChatList(true);
  };

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit("typing_start", selectedChat._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", selectedChat._id);
      }, 3000);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p._id !== currentUser?._id);
  };

  const getSenderName = (msg: Message) => {
    if (msg.sender === currentUser?._id) return "You";
    const participant = selectedChat?.participants.find(
      (p) => p._id === msg.sender,
    );
    return participant?.fullName || "Unknown";
  };

  const isMessageFromMe = (message: Message) => {
    return message.sender === currentUser?._id;
  };

  const filteredChats = searchQuery.trim()
    ? chats.filter((chat) => {
      const other = getOtherParticipant(chat);
      return (
        other?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.shop.shopName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    : chats;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-3 border-taja-primary/20 border-t-taja-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Loading messages…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pb-[65px] md:pb-0 bg-gradient-to-br from-gray-50 via-white to-taja-primary/5 flex flex-col overflow-hidden">
      {/* Security Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-taja-secondary mb-1">
                  Security Alert
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your message contains what appears to be{" "}
                  <span className="font-bold text-amber-600">
                    {warningDetails.type}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold mb-2">
                    ⚠️ Important Security Notice:
                  </p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>
                      Always pay through the Taja platform for buyer protection
                    </li>
                    <li>
                      Never share account numbers or make direct transfers
                    </li>
                    <li>Escrow ensures your money is safe until delivery</li>
                    <li>Off-platform payments are NOT protected</li>
                    <li>You could lose your money with no recourse</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelWarning}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="h-4 w-4" />
                  Edit Message
                </span>
              </button>
              <button
                onClick={handleSendWithWarning}
                className="flex-1 px-4 py-2.5 rounded-xl bg-taja-primary text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  Send Anyway
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 z-10 sticky top-0 shadow-sm">
        <Logo size="md" variant="header" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-taja-primary" />
            <span className="text-sm font-black text-taja-secondary tracking-tight">
              Messages
            </span>
          </div>
          <Link href={currentUser?.role === "seller" ? "/seller" : "/dashboard"}>
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 active:scale-95 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 bg-white shadow-xl max-w-7xl mx-auto w-full border-l border-r border-gray-100 overflow-hidden relative">
        {/* ════════════════════════════════
            CHAT LIST (Sidebar)
            - Always visible on md+
            - Toggle on mobile via showChatList
        ════════════════════════════════ */}
        <div
          className={`
          ${showChatList ? "flex" : "hidden"}
          md:flex
          w-full md:w-80 lg:w-96
          border-r border-gray-100
          bg-white flex-col shrink-0
        `}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Chat Items */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {filteredChats.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-taja-secondary mb-1">
                  {searchQuery ? "No matches" : "No conversations yet"}
                </p>
                <p className="text-xs font-medium text-gray-400">
                  {searchQuery
                    ? "Try a different search."
                    : "Start chatting with a shop to see your messages here."}
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                const unreadCount = chat.unreadCount[currentUser?._id] || 0;
                const isActive = selectedChat?._id === chat._id;

                return (
                  <button
                    key={chat._id}
                    onClick={() => handleChatSelect(chat)}
                    className={`w-full text-left px-4 py-4 border-b border-gray-50 transition-all duration-200 min-h-[80px] ${isActive
                      ? "bg-gradient-to-r from-taja-primary/10 to-emerald-500/5 border-l-[3px] border-l-taja-primary"
                      : "hover:bg-gray-50 border-l-[3px] border-l-transparent active:bg-gray-100"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with Verification Badge */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-taja-primary/20 to-emerald-500/20 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                          {otherParticipant?.avatar ? (
                            <Image
                              src={otherParticipant.avatar}
                              alt={otherParticipant.fullName}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-taja-primary font-black text-base">
                              {otherParticipant?.fullName
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        {otherParticipant?.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-taja-primary rounded-full flex items-center justify-center ring-2 ring-white">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-taja-secondary truncate">
                            {otherParticipant?.fullName}
                          </h3>
                          {chat.lastMessageAt && (
                            <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap shrink-0">
                              {formatDistanceToNow(
                                new Date(chat.lastMessageAt),
                                { addSuffix: true },
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 truncate">
                            {chat.lastMessage || "No messages yet"}
                          </p>
                          {unreadCount > 0 && (
                            <span className="bg-taja-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        {chat.shop && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-taja-primary/70 mt-1">
                            <Store className="h-3 w-3" />
                            <span className="truncate">
                              {chat.shop.shopName}
                            </span>
                          </div>
                        )}

                        {chat.product && (
                          <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg max-w-fit">
                            <ShoppingBag className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="text-[10px] font-medium text-gray-500 truncate">
                              {chat.product.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ════════════════════════════════
            CONVERSATION VIEW
            - Always visible on md+
            - Toggle on mobile via !showChatList
        ════════════════════════════════ */}
        {selectedChat ? (
          <div
            className={`
            ${showChatList ? "hidden" : "flex"}
            md:flex
            flex-1 flex-col min-w-0 min-h-0 h-full relative bg-white
          `}
          >
            {/* Conversation Header */}
            <div className="px-3 sm:px-4 py-3 border-b flex-none border-gray-100 bg-white/95 backdrop-blur-sm flex items-center justify-between shrink-0 z-30 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button — mobile only */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors shrink-0 active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="relative shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-taja-primary/20 to-emerald-500/20 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                    {getOtherParticipant(selectedChat)?.avatar ? (
                      <Image
                        src={getOtherParticipant(selectedChat)!.avatar!}
                        alt={getOtherParticipant(selectedChat)!.fullName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-taja-primary font-black text-sm">
                        {getOtherParticipant(selectedChat)
                          ?.fullName.charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  {getOtherParticipant(selectedChat)?.isVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-taja-primary rounded-full flex items-center justify-center ring-2 ring-white">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-taja-secondary truncate">
                    {getOtherParticipant(selectedChat)?.fullName}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 truncate flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {selectedChat.shop.shopName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/shop/${selectedChat.shop.shopSlug}`}>
                  <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-taja-primary transition-colors active:scale-95">
                    <Info className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Security Banner */}
            {showSecurityBanner && (
              <div className="mx-3 sm:mx-4 mt-3 mb-2 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-taja-primary/5 border border-emerald-200 rounded-xl flex items-start gap-2.5 shrink-0">
                <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">
                    🔒 Always pay through Taja for buyer protection & escrow
                    security
                  </p>
                </div>
                <button
                  onClick={() => setShowSecurityBanner(false)}
                  className="text-emerald-600 hover:text-emerald-800 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Product Info (if applicable) */}
            {selectedChat.product && (
              <div className="px-3 sm:px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedChat.product.images[0]}
                    alt={selectedChat.product.title}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-taja-secondary truncate">
                      {selectedChat.product.title}
                    </h4>
                    <p className="text-xs font-black text-taja-primary">
                      ₦{selectedChat.product.price.toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/product/${selectedChat.product._id}`}>
                    <Button
                      size="sm"
                      className="rounded-lg text-[10px] font-bold h-8 px-3 shrink-0"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ── Messages Area ── */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-3 bg-gray-50/30"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {selectedChat.messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <MessageCircle className="h-10 w-10 text-gray-200 mx-auto" />
                    <p className="text-xs font-bold text-gray-400">
                      No messages yet. Say hello!
                    </p>
                  </div>
                </div>
              )}

              {selectedChat.messages.map((msg, idx) => {
                const fromMe = isMessageFromMe(msg);
                const senderName = getSenderName(msg);
                // Show sender name if different from previous message's sender
                const prevMsg =
                  idx > 0 ? selectedChat.messages[idx - 1] : null;
                const showSender = !prevMsg || prevMsg.sender !== msg.sender;

                return (
                  <div
                    key={msg._id}
                    className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* Other user's avatar (small, on left) */}
                    {!fromMe && showSender && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-taja-primary/10 to-emerald-500/10 flex items-center justify-center mr-2 mt-5 shrink-0">
                        <span className="text-[10px] font-black text-taja-primary">
                          {senderName.charAt(0)}
                        </span>
                      </div>
                    )}
                    {!fromMe && !showSender && (
                      <div className="w-7 mr-2 shrink-0" />
                    )}

                    <div className={`max-w-[78%] sm:max-w-[65%] lg:max-w-md`}>
                      {/* Sender name label */}
                      {showSender && (
                        <p
                          className={`text-[10px] font-bold mb-1 px-1 ${fromMe
                            ? "text-right text-taja-primary/60"
                            : "text-left text-gray-400"
                            }`}
                        >
                          {senderName}
                        </p>
                      )}

                      <div
                        className={`px-3.5 py-2.5 ${fromMe
                          ? "bg-taja-primary text-white rounded-2xl rounded-br-md"
                          : "bg-white text-taja-secondary border border-gray-100 rounded-2xl rounded-bl-md shadow-sm"
                          }`}
                      >
                        {msg.content && msg.content !== "📎 Attachment" && (
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        {(msg as Message).attachments?.length ? (
                          <div className="mt-1.5 space-y-1.5">
                            {(msg as Message).attachments!.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-xl overflow-hidden"
                              >
                                <Image
                                  src={url}
                                  alt="Attachment"
                                  width={240}
                                  height={180}
                                  className="object-cover max-h-48 w-full rounded-xl"
                                  unoptimized={
                                    url.startsWith("data:") ||
                                    url.includes("cloudinary")
                                  }
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <div
                          className={`flex items-center gap-1.5 mt-1 ${fromMe ? "justify-end" : "justify-start"}`}
                        >
                          <p
                            className={`text-[10px] ${fromMe ? "text-white/60" : "text-gray-400"
                              }`}
                            title={format(new Date(msg.timestamp), "PPpp")}
                          >
                            {formatMessageTime(msg.timestamp)}
                          </p>
                          {fromMe && (
                            <CheckCheck className="h-3 w-3 text-white/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 ml-9">
                    <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      typing…
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Message Input ── */}
            <div
              className="flex-none w-full border-t border-gray-100 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3 z-[60]"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              {/* Pending Attachments */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-1">
                  {pendingAttachments.map((url, i) => (
                    <div key={i} className="relative">
                      <Image
                        src={url}
                        alt="Attachment"
                        width={56}
                        height={56}
                        className="rounded-lg object-cover border border-gray-100"
                        unoptimized={
                          url.startsWith("data:") ||
                          url.includes("cloudinary")
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPendingAttachments((p) =>
                            p.filter((_, j) => j !== i),
                          )
                        }
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Attach button */}
                <label className="cursor-pointer flex items-center justify-center w-11 h-11 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-taja-primary transition-colors shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAttachFile}
                    disabled={uploadingAttachment}
                  />
                  {uploadingAttachment ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-taja-primary rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </label>

                {/* Text input */}
                <div className="flex-1 min-w-0">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                      // Auto-resize
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-2xl text-sm font-medium text-taja-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:bg-white resize-none transition-all leading-snug min-h-[44px]"
                    style={{ maxHeight: "120px" }}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={() => sendMessage()}
                  disabled={
                    (!message.trim() && !pendingAttachments.length) || sending
                  }
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-taja-primary text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state — no chat selected (desktop only, on mobile we show chat list) */
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/30">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                <MessageCircle className="h-9 w-9 text-gray-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-taja-secondary mb-1">
                  Select a conversation
                </h3>
                <p className="text-xs font-medium text-gray-400">
                  Choose a conversation from the left to start chatting.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
