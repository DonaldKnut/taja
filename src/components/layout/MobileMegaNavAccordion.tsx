"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Package, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSiteMobileNavBlocks } from "@/components/layout/SiteMegaNav";
import { isMegaMenuActive, type MegaMenuId } from "@/components/layout/siteMegaMenuConfig";

function linkIsActive(pathname: string, href: string): boolean {
  if (href === "/blog") return pathname.startsWith("/blog");
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function defaultOpenSection(pathname: string, blocks: { id: string }[]): MegaMenuId {
  for (const b of blocks) {
    if (isMegaMenuActive(pathname, b.id as MegaMenuId)) return b.id as MegaMenuId;
  }
  return "shop";
}

export type MobileMegaNavAccordionProps = {
  pathname: string;
  onNavigate?: () => void;
  variant?: "app" | "home";
  className?: string;
};

/**
 * Collapsible mobile nav: accordion sections (Shop, Discover, …) with per-link icons.
 */
export function MobileMegaNavAccordion({
  pathname,
  onNavigate,
  variant = "app",
  className,
}: MobileMegaNavAccordionProps) {
  const blocks = useMemo(() => getSiteMobileNavBlocks(), []);
  const derivedOpen = useMemo(
    () => defaultOpenSection(pathname, blocks),
    [blocks, pathname]
  );
  const [openId, setOpenId] = useState<MegaMenuId | null>(derivedOpen);

  useEffect(() => {
    setOpenId(derivedOpen);
  }, [derivedOpen]);

  const toggle = (id: MegaMenuId) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const isHome = variant === "home";

  return (
    <nav className={cn("flex flex-col gap-2", className)} aria-label="Site sections">
      {blocks.map((block) => {
        const SectionIcon = block.icon as LucideIcon;
        const expanded = openId === block.id;
        const panelId = `mobile-mega-${block.id}`;

        return (
          <div
            key={block.id}
            className={cn(
              "rounded-2xl border overflow-hidden transition-colors",
              isHome ? "border-white/40 bg-white/50" : "border-slate-100 bg-white shadow-sm"
            )}
          >
            <button
              type="button"
              id={`${panelId}-trigger`}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => toggle(block.id as MegaMenuId)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3.5 text-left transition-colors",
                isHome ? "hover:bg-white/70" : "hover:bg-taja-light/20",
                expanded && (isHome ? "bg-white/80" : "bg-taja-light/15")
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
                  isHome ? "bg-taja-light/80 text-taja-primary" : "bg-taja-light/50 text-taja-secondary"
                )}
              >
                <SectionIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-[9px] font-black uppercase tracking-[0.18em]",
                    isHome ? "text-taja-primary/70" : "text-taja-primary/60"
                  )}
                >
                  {block.eyebrow}
                </p>
                <p
                  className={cn(
                    "text-base font-black tracking-tight truncate",
                    isHome ? "text-taja-secondary" : "text-taja-secondary"
                  )}
                >
                  {block.title}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
                  expanded && "rotate-180"
                )}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${panelId}-trigger`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden border-t border-slate-100/80"
                >
                  <div className={cn("px-2 py-2 space-y-0.5", isHome && "bg-white/30")}>
                    {block.links.map((link) => {
                      const LinkIcon = (link.icon as LucideIcon | undefined) ?? Package;
                      const active = linkIsActive(pathname, link.href);
                      return (
                        <Link
                          key={`${block.id}-${link.label}-${link.href}`}
                          href={link.href}
                          onClick={onNavigate}
                          className={cn(
                            "group flex items-start gap-3 rounded-xl p-3 transition-all active:scale-[0.99]",
                            isHome ? "hover:bg-white/90" : "hover:bg-taja-light/25",
                            active && (isHome ? "bg-white shadow-sm" : "bg-taja-light/40")
                          )}
                        >
                          <div
                            className={cn(
                              "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                              active
                                ? "bg-taja-primary text-white"
                                : isHome
                                  ? "bg-white border border-slate-100 text-slate-400 group-hover:text-taja-primary"
                                  : "bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-taja-primary"
                            )}
                          >
                            <LinkIcon className="h-4 w-4" aria-hidden />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <span
                              className={cn(
                                "text-sm font-bold tracking-tight block",
                                active ? "text-taja-primary" : "text-taja-secondary"
                              )}
                            >
                              {link.label}
                            </span>
                            {link.description ? (
                              <span className="text-[10px] font-medium text-slate-500 leading-snug mt-0.5 block">
                                {link.description}
                              </span>
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
    </nav>
  );
}
