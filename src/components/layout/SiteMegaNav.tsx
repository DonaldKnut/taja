"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SITE_MEGA_MENU,
  isMegaMenuActive,
  type MegaMenuId,
} from "@/components/layout/siteMegaMenuConfig";

export type SiteMegaNavProps = {
  pathname: string;
  /** App header: uppercase compact triggers. Homepage: slightly larger default text. */
  variant?: "app" | "home";
  className?: string;
  /** When provided, Escape closes the open panel (keyboard). */
  idPrefix?: string;
};

export function SiteMegaNav({ pathname, variant = "app", className, idPrefix = "mega" }: SiteMegaNavProps) {
  const [open, setOpen] = useState<MegaMenuId | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelLeave();
    leaveTimer.current = setTimeout(() => setOpen(null), 160);
  }, [cancelLeave]);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  const triggerClass =
    variant === "app"
      ? "text-[10px] font-black uppercase tracking-[0.22em] px-1 py-2 rounded-lg transition-colors flex items-center gap-1"
      : "text-sm font-bold tracking-tight px-1 py-2 rounded-lg transition-colors flex items-center gap-1";

  return (
    <div
      className={cn("relative", className)}
      onMouseLeave={scheduleClose}
    >
      <nav className="flex items-center gap-3 sm:gap-4 lg:gap-7 flex-wrap" aria-label="Primary sections">
        {SITE_MEGA_MENU.map((section) => {
          const active = isMegaMenuActive(pathname, section.id);
          const isOpen = open === section.id;
          return (
            <div key={section.id} className="relative">
              <button
                type="button"
                id={`${idPrefix}-trigger-${section.id}`}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${section.id}`}
                className={cn(
                  triggerClass,
                  active || isOpen ? "text-taja-primary" : "text-gray-400 hover:text-taja-secondary",
                  variant === "home" && !(active || isOpen) && "text-taja-secondary hover:text-taja-primary"
                )}
                onMouseEnter={() => {
                  cancelLeave();
                  setOpen(section.id);
                }}
                onFocus={() => {
                  cancelLeave();
                  setOpen(section.id);
                }}
                onClick={() => setOpen((prev) => (prev === section.id ? null : section.id))}
              >
                {section.label}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 opacity-60 transition-transform",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
            </div>
          );
        })}
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            key={open}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            id={`${idPrefix}-panel-${open}`}
            role="region"
            aria-labelledby={`${idPrefix}-trigger-${open}`}
            className="absolute left-1/2 top-full z-[60] -translate-x-1/2 pt-3 w-[min(56rem,calc(100vw-1.5rem))]"
            onMouseEnter={cancelLeave}
          >
            {(() => {
              const section = SITE_MEGA_MENU.find((s) => s.id === open);
              if (!section) return null;
              return (
                <div className="rounded-2xl border border-slate-100/80 bg-white/95 backdrop-blur-xl shadow-[0_24px_80px_-24px_rgba(15,23,42,0.25)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{section.eyebrow}</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{section.label}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    {section.columns.map((col) => (
                      <div key={col.heading} className="p-6 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{col.heading}</p>
                        <ul className="space-y-3">
                          {col.links.map((link) => (
                            <li key={link.href + link.label}>
                              <Link
                                href={link.href}
                                className="group block rounded-xl -mx-2 px-2 py-2 hover:bg-slate-50 transition-colors"
                                onClick={() => setOpen(null)}
                              >
                                <span className="text-sm font-bold text-slate-900 group-hover:text-taja-primary transition-colors">
                                  {link.label}
                                </span>
                                {link.description ? (
                                  <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                                    {link.description}
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Flat link list for mobile drawers — same IA as mega menu. */
export function getSiteMobileNavBlocks() {
  return SITE_MEGA_MENU.map((section) => ({
    title: section.label,
    links: section.columns.flatMap((c) => c.links.map((l) => ({ label: l.label, href: l.href }))),
  }));
}
