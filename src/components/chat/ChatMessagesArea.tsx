"use client";

import Image from "next/image";
import { CheckCheck, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import type { ChatMessage, ChatThread } from "./types";

interface ChatMessagesAreaProps {
  selectedChat: ChatThread;
  typingUsers: Set<string>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isMessageFromMe: (message: ChatMessage) => boolean;
  getSenderName: (message: ChatMessage) => string;
  formatMessageTime: (date: Date | string) => string;
}

export function ChatMessagesArea({
  selectedChat,
  typingUsers,
  messagesEndRef,
  isMessageFromMe,
  getSenderName,
  formatMessageTime,
}: ChatMessagesAreaProps) {
  return (
    <div
      className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-3 bg-gray-50/30"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {selectedChat.messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <MessageCircle className="h-10 w-10 text-gray-200 mx-auto" />
            <p className="text-xs font-bold text-gray-400">No messages yet. Say hello!</p>
          </div>
        </div>
      )}

      {selectedChat.messages.map((msg, idx) => {
        const fromMe = isMessageFromMe(msg);
        const senderName = getSenderName(msg);
        const prevMsg = idx > 0 ? selectedChat.messages[idx - 1] : null;
        const showSender = !prevMsg || prevMsg.sender !== msg.sender;

        return (
          <div key={msg._id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
            {!fromMe && showSender && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-taja-primary/10 to-emerald-500/10 flex items-center justify-center mr-2 mt-5 shrink-0">
                <span className="text-[10px] font-black text-taja-primary">{senderName.charAt(0)}</span>
              </div>
            )}
            {!fromMe && !showSender && <div className="w-7 mr-2 shrink-0" />}

            <div className="max-w-[78%] sm:max-w-[65%] lg:max-w-md">
              {showSender && (
                <p
                  className={`text-[10px] font-bold mb-1 px-1 ${
                    fromMe ? "text-right text-taja-primary/60" : "text-left text-gray-400"
                  }`}
                >
                  {senderName}
                </p>
              )}

              <div
                className={`px-3.5 py-2.5 ${
                  fromMe
                    ? "bg-taja-primary text-white rounded-2xl rounded-br-md"
                    : "bg-white text-taja-secondary border border-gray-100 rounded-2xl rounded-bl-md shadow-sm"
                }`}
              >
                {msg.content && msg.content !== "📎 Attachment" && (
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                )}

                {msg.attachments?.length ? (
                  <div className="mt-1.5 space-y-1.5">
                    {msg.attachments.map((url, i) => (
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
                          unoptimized={url.startsWith("data:") || url.includes("cloudinary")}
                        />
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className={`flex items-center gap-1.5 mt-1 ${fromMe ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`text-[10px] ${fromMe ? "text-white/60" : "text-gray-400"}`}
                    title={format(new Date(msg.timestamp), "PPpp")}
                  >
                    {formatMessageTime(msg.timestamp)}
                  </p>
                  {fromMe && <CheckCheck className="h-3 w-3 text-white/50" />}
                </div>
              </div>
            </div>
          </div>
        );
      })}

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
            <span className="text-[10px] text-gray-400 font-medium">typing…</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
