"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Info, Store, Trash2, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ChatThread, ChatUser } from "./types";

interface ChatConversationHeaderProps {
  selectedChat: ChatThread;
  showSecurityBanner: boolean;
  onHideSecurityBanner: () => void;
  onBackToList: () => void;
  onDeleteChat: (chatId: string) => void;
  getOtherParticipant: (chat: ChatThread) => ChatUser | undefined;
}

export function ChatConversationHeader({
  selectedChat,
  showSecurityBanner,
  onHideSecurityBanner,
  onBackToList,
  onDeleteChat,
  getOtherParticipant,
}: ChatConversationHeaderProps) {
  const otherParticipant = getOtherParticipant(selectedChat);

  return (
    <>
      <div className="px-3 sm:px-4 py-3 border-b flex-none border-gray-100 bg-white/95 backdrop-blur-sm flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToList}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors shrink-0 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-taja-primary/20 to-emerald-500/20 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
              {otherParticipant?.avatar ? (
                <Image
                  src={otherParticipant.avatar}
                  alt={otherParticipant.fullName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-taja-primary font-black text-sm">
                  {otherParticipant?.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!selectedChat.isGroup && otherParticipant?.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-taja-primary rounded-full flex items-center justify-center ring-2 ring-white">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-taja-secondary truncate">
              {selectedChat.isGroup ? selectedChat.name : otherParticipant?.fullName}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 truncate flex items-center gap-1">
              <Store className="h-3 w-3" />
              {selectedChat.shop.shopName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onDeleteChat(selectedChat._id)}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors active:scale-95"
            title="Delete Chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <Link href={`/shop/${selectedChat.shop.shopSlug}`}>
            <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-taja-primary transition-colors active:scale-95">
              <Info className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {showSecurityBanner && (
        <div className="mx-3 sm:mx-4 mt-3 mb-2 px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-taja-primary/5 border border-emerald-200 rounded-xl flex items-start gap-2.5 shrink-0">
          <Shield className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">
              Always pay through Taja for buyer protection and escrow security
            </p>
          </div>
          <button onClick={onHideSecurityBanner} className="text-emerald-600 hover:text-emerald-800 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {selectedChat.product && (
        <div className="px-3 sm:px-4 py-2.5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/90 to-white shrink-0 ring-1 ring-emerald-100/80">
          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-800 mb-1.5">
            You are messaging about this listing
          </p>
          <div className="flex items-center gap-3">
            <Image
              src={selectedChat.product.images[0]}
              alt={selectedChat.product.title}
              width={40}
              height={40}
              className="rounded-lg object-cover shrink-0 ring-2 ring-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-taja-secondary truncate">
                {selectedChat.product.title}
              </h4>
              <p className="text-xs font-black text-taja-primary">
                ₦{selectedChat.product.price.toLocaleString()}
              </p>
            </div>
            {selectedChat.product.slug ? (
              <Link href={`/product/${selectedChat.product.slug}`}>
                <Button size="sm" className="rounded-lg text-[10px] font-bold h-8 px-3 shrink-0">
                  View listing
                </Button>
              </Link>
            ) : (
              <Button size="sm" disabled className="rounded-lg text-[10px] font-bold h-8 px-3 shrink-0 opacity-60">
                View listing
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
