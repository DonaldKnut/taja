"use client";

import Image from "next/image";
import { Check, MessageCircle, Search, ShoppingBag, Store, Users, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import type { ChatThread, ChatUser } from "./types";

interface ChatSidebarProps {
  showChatList: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  showGroupModal: boolean;
  onShowGroupModalChange: (open: boolean) => void;
  groupName: string;
  onGroupNameChange: (value: string) => void;
  selectedParticipants: string[];
  onSelectedParticipantsChange: (participants: string[]) => void;
  uniqueContacts: ChatUser[];
  filteredChats: ChatThread[];
  selectedChat: ChatThread | null;
  currentUser: any;
  onCreateGroup: () => void;
  onChatSelect: (chat: ChatThread) => void;
  getOtherParticipant: (chat: ChatThread) => ChatUser | undefined;
}

export function ChatSidebar({
  showChatList,
  searchQuery,
  onSearchQueryChange,
  showGroupModal,
  onShowGroupModalChange,
  groupName,
  onGroupNameChange,
  selectedParticipants,
  onSelectedParticipantsChange,
  uniqueContacts,
  filteredChats,
  selectedChat,
  currentUser,
  onCreateGroup,
  onChatSelect,
  getOtherParticipant,
}: ChatSidebarProps) {
  return (
    <div
      className={`
        ${showChatList ? "flex" : "hidden"}
        md:flex
        w-full md:w-80 lg:w-96
        border-r border-gray-100
        bg-white flex-col shrink-0
      `}
    >
      <div className="p-3 border-b border-gray-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm font-medium text-taja-secondary placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:bg-white transition-all"
          />
        </div>
        <button
          onClick={() => onShowGroupModalChange(true)}
          className="flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-taja-primary text-white hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
          title="New Group Chat"
        >
          <Users className="h-5 w-5" />
        </button>
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-taja-secondary">New Group</h3>
              <button
                onClick={() => onShowGroupModalChange(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 shrink-0">
              <label className="text-xs font-bold text-gray-600 block mb-1">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => onGroupNameChange(e.target.value)}
                placeholder="E.g., VIP Customers"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-taja-primary/20 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 mb-4 border border-gray-100 rounded-xl divide-y divide-gray-100">
              {uniqueContacts.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">No previous contacts found.</div>
              ) : (
                uniqueContacts.map((contact) => (
                  <label
                    key={contact._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-taja-primary/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                        {contact.avatar ? (
                          <Image
                            src={contact.avatar}
                            alt={contact.fullName}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-black text-taja-primary">
                            {contact.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{contact.fullName}</span>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-taja-primary rounded border-gray-300 focus:ring-taja-primary"
                      checked={selectedParticipants.includes(contact._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedParticipantsChange([...selectedParticipants, contact._id]);
                        } else {
                          onSelectedParticipantsChange(
                            selectedParticipants.filter((id) => id !== contact._id)
                          );
                        }
                      }}
                    />
                  </label>
                ))
              )}
            </div>

            <Button
              onClick={onCreateGroup}
              disabled={!groupName.trim() || selectedParticipants.length === 0}
              className="w-full rounded-xl"
            >
              Create Group
            </Button>
          </div>
        </div>
      )}

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
              {searchQuery ? "Try a different search." : "Start chatting with a shop to see your messages here."}
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
                onClick={() => onChatSelect(chat)}
                className={`w-full text-left px-4 py-4 border-b border-gray-50 transition-all duration-200 min-h-[80px] ${
                  isActive
                    ? "bg-gradient-to-r from-taja-primary/10 to-emerald-500/5 border-l-[3px] border-l-taja-primary"
                    : "hover:bg-gray-50 border-l-[3px] border-l-transparent active:bg-gray-100"
                }`}
              >
                <div className="flex items-start gap-3">
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
                          {otherParticipant?.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {!chat.isGroup && otherParticipant?.isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-taja-primary rounded-full flex items-center justify-center ring-2 ring-white">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className="text-sm font-black text-taja-secondary truncate">
                        {chat.isGroup ? chat.name : otherParticipant?.fullName}
                      </h3>
                      {chat.lastMessageAt && (
                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap shrink-0">
                          {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage || "No messages yet"}</p>
                      {unreadCount > 0 && (
                        <span className="bg-taja-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {chat.shop && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-taja-primary/70 mt-1">
                        <Store className="h-3 w-3" />
                        <span className="truncate">{chat.shop.shopName}</span>
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
  );
}
