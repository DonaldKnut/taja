"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

interface ChatPageHeaderProps {
  dashboardHref: string;
}

export function ChatPageHeader({ dashboardHref }: ChatPageHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0 z-10 sticky top-0 shadow-sm">
      <Logo size="md" variant="header" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-taja-primary" />
          <span className="text-sm font-black text-taja-secondary tracking-tight">Messages</span>
        </div>
        <Link href={dashboardHref}>
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 active:scale-95 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </div>
        </Link>
      </div>
    </header>
  );
}
