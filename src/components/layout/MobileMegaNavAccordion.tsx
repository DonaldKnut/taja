"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSiteMobileNavBlocks } from "@/components/layout/SiteMegaNav";

export interface MobileMegaNavAccordionProps {
  pathname: string;
  onNavigate?: () => void;
  variant?: "app" | "home";
  className?: string;
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function MobileMegaNavAccordion({
  pathname,
  onNavigate,
  variant = "app",
  className,
}: MobileMegaNavAccordionProps) {
  const blocks = useMemo(() => getSiteMobileNavBlocks(), []);
  const [openId, setOpenId] = useState<string | null>(blocks[0]?.id ?? null);
  const isHome = variant === "home";

  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((block) => {
        const expanded = openId === block.id;
        return (
          <div
            key={block.id}
            className={cn(
              "rounded-2xl border overflow-hidden",
              isHome ? "border-white/40 bg-white/50" : "border-slate-100 bg-white"
            )}
          >
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3.5 text-left",
                isHome ? "hover:bg-white/80" : "hover:bg-taja-light/10"
              )}
              onClick={() => setOpenId((prev) => (prev === block.id ? null : block.id))}
              aria-expanded={expanded}
            >
              <div className="h-9 w-9 rounded-xl bg-taja-light/60 text-taja-secondary flex items-center justify-center">
                {block.icon ? <block.icon className="h-4 w-4" /> : <Package className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-taja-primary/60">{block.eyebrow}</p>
                <p className="text-base font-black text-taja-secondary tracking-tight truncate">{block.title}</p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-100/80"
                >
                  <div className={cn("px-2 py-2 space-y-1", isHome && "bg-white/30")}>
                    {block.links.map((link) => {
                      const active = isActivePath(pathname, link.href);
                      return (
                        <Link
                          key={`${block.id}-${link.label}-${link.href}`}
                          href={link.href}
                          onClick={onNavigate}
                          className={cn(
                            "group flex items-start gap-3 rounded-xl p-3 transition-all",
                            active ? "bg-taja-light/40" : "hover:bg-taja-light/20"
                          )}
                        >
                          <div
                            className={cn(
                              "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center",
                              active
                                ? "bg-taja-primary text-white"
                                : "bg-white border border-slate-100 text-slate-400 group-hover:text-taja-primary"
                            )}
                          >
                            {link.icon ? <link.icon className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className={cn("text-sm font-bold tracking-tight", active ? "text-taja-primary" : "text-taja-secondary")}>
                              {link.label}
                            </p>
                            {link.description ? (
                              <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{link.description}</p>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

