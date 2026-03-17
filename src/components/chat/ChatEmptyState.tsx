"use client";

import { MessageCircle } from "lucide-react";

export function ChatEmptyState() {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50/30">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
          <MessageCircle className="h-9 w-9 text-gray-300" />
        </div>
        <div>
          <h3 className="text-base font-bold text-taja-secondary mb-1">Select a conversation</h3>
          <p className="text-xs font-medium text-gray-400">
            Choose a conversation from the left to start chatting.
          </p>
        </div>
      </div>
    </div>
  );
}
