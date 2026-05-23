"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SITE_MEGA_MENU,
  isMegaMenuActive,
  type MegaMenuId,
} from "@/components/layout/siteMegaMenuConfig";
import { AnimatedMegaMenuChevron, MegaMenuLinkRow } from "@/components/layout/megaMenu";

export type SiteMegaNavProps = {
  pathname: string;
  /** App header: uppercase compact triggers. Homepage: slightly larger default text. */
  variant?: "app" | "home";
  className?: string;
  /** When provided, Escape closes the open panel (keyboard). */
  idPrefix?: string;
  /** Solid light header (e.g. marketplace): nav triggers stay near-black in dark mode. */
  lightHeaderChrome?: boolean;
};

function clampMegaPanelToViewport(panelEl: HTMLElement) {
  const edge = 14;
  const vw = window.innerWidth;
  const maxW = Math.min(560, vw - edge * 2);
  panelEl.style.width = `${maxW}px`;
  panelEl.style.maxWidth = `${maxW}px`;
  panelEl.style.transform = "translateX(-50%)";
  void panelEl.offsetHeight;
  const r = panelEl.getBoundingClientRect();
  let shift = 0;
  if (r.right > vw - edge) shift -= r.right - (vw - edge);
  if (r.left + shift < edge) shift += edge - (r.left + shift);
  panelEl.style.transform = shift === 0 ? "translateX(-50%)" : `translateX(calc(-50% + ${shift}px))`;
}

export function SiteMegaNav({
  pathname,
  variant = "app",
  className,
  idPrefix = "mega",
  lightHeaderChrome = false,
}: SiteMegaNavProps) {
  const [open, setOpen] = useState<MegaMenuId | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelInnerRef = useRef<HTMLDivElement>(null);

  const cancelLeave = useCallback(() => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelLeave();
    leaveTimer.current = setTimeout(() => setOpen(null), 280);
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

  useLayoutEffect(() => {
    if (!open || !rootRef.current || !panelInnerRef.current) return;

    const run = () => {
      const root = rootRef.current;
      const panel = panelInnerRef.current;
      if (!root || !panel) return;
      const anchor = root.getBoundingClientRect();
      panel.style.position = "fixed";
      panel.style.top = `${Math.round(anchor.bottom + 6)}px`;
      panel.style.left = `${Math.round(anchor.left + anchor.width / 2)}px`;
      panel.style.zIndex = "100000";
      clampMegaPanelToViewport(panel);
    };

    run();
    let rafOuter = 0;
    let rafInner = 0;
    rafOuter = window.requestAnimationFrame(() => {
      rafInner = window.requestAnimationFrame(run);
    });
    window.addEventListener("resize", run);
    window.addEventListener("scroll", run, true);
    return () => {
      window.cancelAnimationFrame(rafOuter);
      window.cancelAnimationFrame(rafInner);
      window.removeEventListener("resize", run);
      window.removeEventListener("scroll", run, true);
    };
  }, [open]);

  const triggerClass =
    variant === "app"
      ? "text-[9px] xl:text-[10px] font-black uppercase tracking-[0.14em] xl:tracking-[0.22em] px-0.5 xl:px-1 py-2 rounded-lg transition-colors flex items-center gap-0.5 xl:gap-1 whitespace-nowrap shrink-0"
      : "text-sm font-bold tracking-tight px-1 py-2 rounded-lg transition-colors flex items-center gap-1";

  return (
    <motion.div
      ref={rootRef}
      className={cn("relative overflow-visible", className)}
      onMouseLeave={scheduleClose}
      initial={false}
    >
      <nav
        className="flex flex-nowrap items-center gap-2 sm:gap-2.5 lg:gap-3 xl:gap-6 overflow-x-auto overflow-y-visible scrollbar-hide overscroll-x-contain"
        aria-label="Primary sections"
      >
        {SITE_MEGA_MENU.map((section) => {
          const active = isMegaMenuActive(pathname, section.id);
          const isOpen = open === section.id;
          return (
            <div
              key={section.id}
              className={cn("relative shrink-0", variant === "app" && section.id === "company" && "hidden xl:block")}
            >
              <button
                type="button"
                id={`${idPrefix}-trigger-${section.id}`}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-panel-${section.id}`}
                className={cn(
                  triggerClass,
                  active || isOpen
                    ? "text-taja-primary"
                    : lightHeaderChrome
                      ? "text-slate-900 hover:text-taja-primary dark:text-slate-900"
                      : "text-gray-400 hover:text-taja-secondary",
                  variant === "home" &&
                    !(active || isOpen) &&
                    !lightHeaderChrome &&
                    "text-taja-secondary hover:text-taja-primary"
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
                <AnimatedMegaMenuChevron
                  open={isOpen}
                  className={cn(variant === "app" && "hidden xl:block")}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            id={`${idPrefix}-panel-${open}`}
            role="region"
            aria-labelledby={`${idPrefix}-trigger-${open}`}
            className="absolute top-full left-0 z-[60] pt-3 pointer-events-none overflow-visible"
            onMouseEnter={cancelLeave}
          >
            <div
              ref={panelInnerRef}
              className="pointer-events-auto fixed z-[100000] rounded-xl sm:rounded-2xl border border-slate-200/95 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)] overflow-hidden max-h-[min(70vh,calc(100dvh-5.5rem))] overflow-y-auto overscroll-contain"
              onMouseEnter={cancelLeave}
            >
              {(() => {
                const section = SITE_MEGA_MENU.find((s) => s.id === open);
                if (!section) return null;
                return (
                  <>
                    <div className="px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{section.eyebrow}</p>
                      <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{section.label}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                      {section.columns.map((col) => (
                        <div key={col.heading} className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{col.heading}</p>
                          <ul className="space-y-1 sm:space-y-2">
                            {col.links.map((link, linkIndex) => (
                              <MegaMenuLinkRow
                                key={link.href + link.label}
                                href={link.href}
                                label={link.label}
                                description={link.description}
                                icon={link.icon}
                                entranceDelay={linkIndex * 0.04}
                                playEntrance
                                onNavigate={() => setOpen(null)}
                                variant="desktop"
                              />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
