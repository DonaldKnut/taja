"use client";

import Image from "next/image";
import { Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  message: string;
  onMessageChange: (value: string) => void;
  onTyping: () => void;
  onSend: () => void;
  onAttachFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sending: boolean;
  uploadingAttachment: boolean;
  pendingAttachments: string[];
  setPendingAttachments: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ChatComposer({
  message,
  onMessageChange,
  onTyping,
  onSend,
  onAttachFile,
  sending,
  uploadingAttachment,
  pendingAttachments,
  setPendingAttachments,
}: ChatComposerProps) {
  return (
    <div
      className={cn(
        "w-full flex-none border-t border-gray-100 bg-white/95 backdrop-blur-sm p-2.5 sm:p-3",
        /* Mobile: flush on top of bottom nav (nav owns safe-area); md+ stays in document flow */
        "max-md:fixed max-md:inset-x-0 max-md:z-[55] max-md:shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.08)]",
        "max-md:bottom-[var(--mobile-bottom-nav-height,calc(env(safe-area-inset-bottom,0px)+3.5rem))]",
        "md:relative md:bottom-auto md:z-auto md:shadow-none"
      )}
    >
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
                unoptimized={url.startsWith("data:") || url.includes("cloudinary")}
              />
              <button
                type="button"
                onClick={() => setPendingAttachments((p) => p.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 shadow-lg transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <label className="cursor-pointer flex items-center justify-center w-11 h-11 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-taja-primary transition-colors shrink-0">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onAttachFile}
            disabled={uploadingAttachment}
          />
          {uploadingAttachment ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-taja-primary rounded-full animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </label>

        <div className="flex-1 min-w-0">
          <textarea
            value={message}
            onChange={(e) => {
              onMessageChange(e.target.value);
              onTyping();
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-2xl text-sm font-medium text-taja-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taja-primary/20 focus:bg-white resize-none transition-all leading-snug min-h-[44px]"
            style={{ maxHeight: "120px" }}
          />
        </div>

        <button
          onClick={onSend}
          disabled={(!message.trim() && !pendingAttachments.length) || sending}
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
  );
}
