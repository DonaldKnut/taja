"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Send, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type ShareShopButtonProps = {
  shopSlug: string;
  shopName?: string;
  className?: string;
};

export function ShareShopButton({ shopSlug, shopName = "my shop", className }: ShareShopButtonProps) {
  const [copied, setCopied] = useState(false);

  const shopUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "https://taja.shop");
    return `${base.replace(/\/$/, "")}/shop/${shopSlug}`;
  }, [shopSlug]);

  const shareText = `Check out ${shopName} on Taja.Shop`;
  const encodedUrl = encodeURIComponent(shopUrl);
  const encodedText = encodeURIComponent(shareText);
  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      toast.success("Shop link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({
        title: shopName,
        text: shareText,
        url: shopUrl,
      });
    } catch {
      // User cancelled share sheet; no toast needed.
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {typeof navigator !== "undefined" && navigator.share && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:border-taja-primary/30 hover:text-taja-primary transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-taja-secondary hover:border-taja-primary/30 hover:text-taja-primary transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-taja-primary" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <Send className="h-3.5 w-3.5" />
        WhatsApp
      </a>
    </div>
  );
}
