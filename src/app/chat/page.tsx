"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { api, uploadProductImage } from "@/lib/api";
import {
  ChatComposer,
  ChatConversationHeader,
  ChatEmptyState,
  ChatLoadingState,
  ChatMessagesArea,
  ChatPageHeader,
  ChatSecurityWarningModal,
  ChatSidebar,
  type ChatMessage as Message,
  type ChatThread as Chat,
  type ChatUser as User,
} from "@/components/chat";
import { detectSuspiciousPatterns } from "@/lib/chat/security";

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

  // Group Chat Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

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
      const socketUrl =
        (process.env.NEXT_PUBLIC_SOCKET_URL || "").trim() ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const newSocket = io(socketUrl, {
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

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      const res = await api(`/api/chat/${chatId}`, { method: 'DELETE' }) as { success?: boolean };
      if (res?.success) {
        toast.success("Chat deleted successfully");
        setChats(prev => prev.filter(c => c._id !== chatId));
        if (selectedChat?._id === chatId) {
          setSelectedChat(null);
          setShowChatList(true);
        }
      } else {
        toast.error("Failed to delete chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat");
    }
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

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) {
      toast.error("Please provide a group name and select participants");
      return;
    }
    try {
      // Find a shop ID to associate with the group chat
      const defaultShopId = chats.length > 0 ? chats[0].shop._id : currentUser?.shop;
      const res = await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          isGroup: true,
          name: groupName,
          additionalParticipants: selectedParticipants,
          shopId: defaultShopId,
        }),
      }) as { success?: boolean; data?: Chat };

      if (res?.success && res?.data) {
        setChats(prev => [res.data!, ...prev]);
        setSelectedChat(res.data!);
        setShowGroupModal(false);
        setGroupName("");
        setSelectedParticipants([]);
        setShowChatList(false);
        toast.success("Group created successfully");
      } else {
        toast.error("Failed to create group");
      }
    } catch (e) {
      toast.error("Failed to create group");
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

  // Extract unique previous contacts for the group chat modal
  const uniqueContacts = Array.from(
    new Map<string, User>(
      chats
        .filter(c => !c.isGroup) // Only pull from 1-on-1 chats to get clean users
        .map(chat => {
          const other = getOtherParticipant(chat);
          return [other?._id, other] as [string | undefined, User | undefined];
        })
        .filter((entry): entry is [string, User] => !!entry[0] && !!entry[1])
    ).values()
  );

  if (loading) {
    return <ChatLoadingState />;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-taja-primary/5 flex flex-col overflow-hidden">
      <ChatSecurityWarningModal
        isOpen={showWarningModal}
        warningType={warningDetails.type}
        onCancel={handleCancelWarning}
        onConfirm={handleSendWithWarning}
      />

      <ChatPageHeader dashboardHref={currentUser?.role === "seller" ? "/seller" : "/dashboard"} />

      <div className="flex-1 flex min-h-0 bg-white shadow-xl max-w-7xl mx-auto w-full border-l border-r border-gray-100 overflow-hidden relative">
        {/* ════════════════════════════════
            CHAT LIST (Sidebar)
            - Always visible on md+
            - Toggle on mobile via showChatList
        ════════════════════════════════ */}
        <ChatSidebar
          showChatList={showChatList}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          showGroupModal={showGroupModal}
          onShowGroupModalChange={setShowGroupModal}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          selectedParticipants={selectedParticipants}
          onSelectedParticipantsChange={setSelectedParticipants}
          uniqueContacts={uniqueContacts}
          filteredChats={filteredChats}
          selectedChat={selectedChat}
          currentUser={currentUser}
          onCreateGroup={handleCreateGroup}
          onChatSelect={handleChatSelect}
          getOtherParticipant={getOtherParticipant}
        />

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
            <ChatConversationHeader
              selectedChat={selectedChat}
              showSecurityBanner={showSecurityBanner}
              onHideSecurityBanner={() => setShowSecurityBanner(false)}
              onBackToList={handleBackToList}
              onDeleteChat={handleDeleteChat}
              getOtherParticipant={getOtherParticipant}
            />

            <ChatMessagesArea
              selectedChat={selectedChat}
              typingUsers={typingUsers}
              messagesEndRef={messagesEndRef}
              isMessageFromMe={isMessageFromMe}
              getSenderName={getSenderName}
              formatMessageTime={formatMessageTime}
            />

            <ChatComposer
              message={message}
              onMessageChange={setMessage}
              onTyping={handleTyping}
              onSend={() => sendMessage()}
              onAttachFile={handleAttachFile}
              sending={sending}
              uploadingAttachment={uploadingAttachment}
              pendingAttachments={pendingAttachments}
              setPendingAttachments={setPendingAttachments}
            />
          </div>
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </div >
  );
}
