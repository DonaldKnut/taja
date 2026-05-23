"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    MessageCircle,
    Search,
    Store,
    Check,
    ShieldAlert,
    Users,
    Eye,
    X
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

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
}

interface Chat {
    _id: string;
    participants: User[];
    isGroup?: boolean;
    name?: string;
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
}

export default function AdminChatsPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredChats(chats);
            return;
        }
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = chats.filter(chat => {
            const participantMatch = chat.participants.some(p => p.fullName.toLowerCase().includes(lowerQuery));
            const shopMatch = chat.shop?.shopName.toLowerCase().includes(lowerQuery);
            const groupMatch = chat.name?.toLowerCase().includes(lowerQuery);
            return participantMatch || shopMatch || groupMatch;
        });
        setFilteredChats(filtered);
    }, [searchQuery, chats]);

    const fetchChats = async () => {
        try {
            const response = await api("/api/chat?all=true");
            const data = response as { success?: boolean; data?: Chat[] };
            if (data?.success && Array.isArray(data.data)) {
                setChats(data.data);
                setFilteredChats(data.data);
            }
        } catch (error) {
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    const getSenderName = (chat: Chat, senderId: string) => {
        const participant = chat.participants.find(p => p._id === senderId);
        return participant?.fullName || "Unknown";
    };

    const formatMessageTime = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date;
        const timeStr = format(d, "h:mm a");
        if (isToday(d)) return timeStr;
        if (isYesterday(d)) return `Yesterday ${timeStr}`;
        return format(d, "MMM d, h:mm a");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-10 w-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Message Audit Logs
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Monitor and audit all platform communications.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Admin Access Active</span>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Search users, shops, or groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                />
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Participants</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Shop / Group Info</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Last Message</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredChats.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                                        No conversations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredChats.map((chat) => (
                                    <tr key={chat._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {chat.isGroup ? (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase">
                                                    <Users className="h-3 w-3" /> Group
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                                                    <MessageCircle className="h-3 w-3" /> Direct
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {chat.participants.slice(0, 3).map((p, i) => (
                                                    <div key={p._id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden" title={p.fullName}>
                                                        {p.avatar ? (
                                                            <Image src={p.avatar} alt={p.fullName} width={32} height={32} className="object-cover w-full h-full" />
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-600">{p.fullName.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                {chat.participants.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shrink-0 z-10">
                                                        <span className="text-[10px] font-bold text-slate-600">+{chat.participants.length - 3}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{chat.isGroup ? chat.name : chat.shop?.shopName || 'Unknown Shop'}</span>
                                                {chat.product && <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">{chat.product.title}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-medium text-slate-600 truncate max-w-[200px]">{chat.lastMessage || "No messages"}</span>
                                                {chat.lastMessageAt && <span className="text-[9px] text-slate-400 font-bold mt-0.5">{formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => setSelectedChat(chat)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View Thread
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chat View Modal */}
            {selectedChat && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    {selectedChat.isGroup ? selectedChat.name : `Chat Audit: ${selectedChat.shop?.shopName}`}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {selectedChat.participants.length} Participants • {selectedChat.messages.length} Messages
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedChat(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
                            {selectedChat.messages.map((msg, idx) => {
                                const senderName = getSenderName(selectedChat, msg.sender);
                                const prevMsg = idx > 0 ? selectedChat.messages[idx - 1] : null;
                                const showSender = !prevMsg || prevMsg.sender !== msg.sender;

                                return (
                                    <div key={msg._id} className="flex flex-col items-start gap-1 max-w-[85%]">
                                        {showSender && (
                                            <span className="text-[10px] font-black text-slate-400 ml-1">{senderName}</span>
                                        )}
                                        <div className="bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm inline-block">
                                            {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                            {msg.attachments?.map((url, i) => (
                                                <Image key={i} src={url} alt="attachment" width={200} height={150} className="rounded-xl mt-2 max-w-full" unoptimized />
                                            ))}
                                            <p className="text-[9px] font-bold text-slate-400 mt-2 text-right">
                                                {formatMessageTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {selectedChat.messages.length === 0 && (
                                <p className="text-center text-slate-500 text-sm py-10">No messages found in this chat.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
