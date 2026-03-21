"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Props = { url: string; title: string; className?: string };

export function BlogShareBar({ url, title, className }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const twitter = `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`;
  const whatsapp = `https://wa.me/?text=${text}%20${encoded}`;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Share</span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:bg-taja-light transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-taja-primary" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 px-4 items-center rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-taja-primary/40 hover:bg-taja-light/50 transition-colors"
      >
        X
      </a>
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 px-4 items-center rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:border-taja-primary/40 hover:bg-taja-light/50 transition-colors"
      >
        WhatsApp
      </a>
    </div>
  );
}
