"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSiteMobileNavBlocks } from "@/components/layout/siteMegaMenuConfig";
import {
  AnimatedMegaMenuChevron,
  MegaMenuLinkRow,
  MegaMenuSectionIcon,
} from "@/components/layout/megaMenu";

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
    <motion.div
      className={cn("space-y-2", className)}
      initial="rest"
      animate="rest"
    >
      {blocks.map((block) => {
        const expanded = openId === block.id;
        return (
          <motion.div
            key={block.id}
            className={cn(
              "rounded-2xl border overflow-hidden",
              isHome ? "border-white/40 bg-white/50" : "border-slate-100 bg-white"
            )}
            layout
          >
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3.5 text-left group",
                isHome ? "hover:bg-white/80" : "hover:bg-taja-light/10"
              )}
              onClick={() => setOpenId((prev) => (prev === block.id ? null : block.id))}
              aria-expanded={expanded}
            >
              <MegaMenuSectionIcon icon={block.icon} expanded={expanded} variant={variant} />
              <motion.div
                className="min-w-0 flex-1"
                variants={{
                  rest: { x: 0 },
                  hover: { x: 2 },
                }}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-taja-primary/60">{block.eyebrow}</p>
                <p className="text-base font-black text-taja-secondary tracking-tight truncate">{block.title}</p>
              </motion.div>
              <AnimatedMegaMenuChevron open={expanded} iconClassName="h-4 w-4 text-slate-400" />
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
                  <ul className={cn("px-2 py-2 space-y-1 list-none", isHome && "bg-white/30")}>
                    {block.links.map((link, linkIndex) => (
                      <MegaMenuLinkRow
                        key={`${block.id}-${link.label}-${link.href}`}
                        href={link.href}
                        label={link.label}
                        description={link.description}
                        icon={link.icon}
                        active={isActivePath(pathname, link.href)}
                        entranceDelay={linkIndex * 0.05}
                        playEntrance={expanded}
                        entranceKey={expanded ? `${block.id}-${link.href}` : undefined}
                        onNavigate={onNavigate}
                        variant="mobile"
                      />
                    ))}
                  </ul>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
