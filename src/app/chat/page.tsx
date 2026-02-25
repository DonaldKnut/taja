"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Send,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Circle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Get current user
    const user = localStorage.getItem("user");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    // Initialize socket connection
    const token = localStorage.getItem("token");
    if (token) {
      const newSocket = io(
        process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL,
        {
          auth: { token },
        }
      );

      setSocket(newSocket);

      // Socket event listeners
      newSocket.on("new_message", (data) => {
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === data.chatId
              ? { ...chat, messages: [...chat.messages, data.message] }
              : chat
          )
        );
      });

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
    fetchChats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/chat`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setChats(data.data);
        if (data.data.length > 0 && !selectedChat) {
          setSelectedChat(data.data[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedChat || sending) return;

    setSending(true);
    const messageText = message;
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/chat/${selectedChat._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: messageText,
            type: "text",
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        toast.error("Failed to send message");
        setMessage(messageText); // Restore message on error
      }
    } catch (error) {
      toast.error("Failed to send message");
      setMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${API_BASE_URL}/api/chat/${chatId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      // Silent fail - not critical
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    if (socket) {
      socket.emit("join_chat", chat._id);
    }
    markAsRead(chat._id);
  };

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit("typing_start", selectedChat._id);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing_stop", selectedChat._id);
      }, 3000);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((p) => p._id !== currentUser?._id);
  };

  const isMessageFromMe = (message: Message) => {
    return message.sender === currentUser?._id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Logo size="md" variant="header" />
        <div className="text-lg font-semibold text-gray-900">Messages</div>
        <div></div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div className="w-80 border-r bg-white flex flex-col">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-taja-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-lg font-medium mb-2">
                  No conversations yet
                </div>
                <p className="text-sm">
                  Start chatting with buyers or sellers!
                </p>
              </div>
            ) : (
              chats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                const unreadCount = chat.unreadCount[currentUser?._id] || 0;

                return (
                  <div
                    key={chat._id}
                    onClick={() => handleChatSelect(chat)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedChat?._id === chat._id
                        ? "bg-taja-primary/5 border-r-2 border-r-taja-primary"
                        : ""
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          {otherParticipant?.avatar ? (
                            <Image
                              src={otherParticipant.avatar}
                              alt={otherParticipant.fullName}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {otherParticipant?.fullName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <Circle className="h-4 w-4 fill-green-400 text-green-400" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {otherParticipant?.fullName}
                            {otherParticipant?.isVerified && (
                              <span className="ml-1 text-taja-primary">✓</span>
                            )}
                          </h3>
                          {chat.lastMessageAt && (
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(chat.lastMessageAt),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {chat.lastMessage || "No messages yet"}
                          </p>
                          {unreadCount > 0 && (
                            <span className="bg-taja-primary text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>

                        {chat.product && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            About: {chat.product.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Content */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {getOtherParticipant(selectedChat)?.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {getOtherParticipant(selectedChat)?.fullName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedChat.shop.shopName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Info (if applicable) */}
            {selectedChat.product && (
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Image
                    src={selectedChat.product.images[0]}
                    alt={selectedChat.product.title}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {selectedChat.product.title}
                    </h4>
                    <p className="text-taja-primary font-semibold">
                      ₦{selectedChat.product.price.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm">View Product</Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedChat.messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    isMessageFromMe(message) ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isMessageFromMe(message)
                        ? "bg-taja-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMessageFromMe(message)
                          ? "text-green-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-taja-primary"
                  />
                </div>

                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  size="icon"
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No conversation selected
              </h3>
              <p className="text-gray-500">
                Choose a conversation to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




