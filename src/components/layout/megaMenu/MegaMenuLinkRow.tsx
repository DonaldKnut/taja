"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedMegaMenuIcon } from "./AnimatedMegaMenuIcon";
import { megaMenuRowVariants } from "./iconAnimations";

export type MegaMenuLinkRowProps = {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  active?: boolean;
  entranceDelay?: number;
  playEntrance?: boolean;
  entranceKey?: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function MegaMenuLinkRow({
  href,
  label,
  description,
  icon,
  active,
  entranceDelay = 0,
  playEntrance = false,
  entranceKey,
  onNavigate,
  variant = "desktop",
}: MegaMenuLinkRowProps) {
  const isMobile = variant === "mobile";

  return (
    <li className="list-none">
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "block rounded-xl transition-colors group",
          isMobile
            ? active
              ? "bg-taja-light/40"
              : "hover:bg-taja-light/20"
            : "-mx-1.5 px-2 py-2 hover:bg-slate-50"
        )}
      >
        <motion.div
          className={cn("flex gap-3 items-start", isMobile && "p-3")}
          variants={megaMenuRowVariants}
          initial="rest"
          whileHover="hover"
        >
          {icon ? (
            <AnimatedMegaMenuIcon
              icon={icon}
              badge={isMobile}
              active={active}
              entranceDelay={entranceDelay}
                playEntrance={playEntrance}
                entranceKey={entranceKey}
                className={cn(!isMobile && "mt-0.5")}
            />
          ) : null}
          <motion.div
            className="min-w-0"
            variants={{
              rest: { x: 0, opacity: 1 },
              hover: { x: isMobile ? 2 : 4, opacity: 1 },
            }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            <span
              className={cn(
                "text-sm font-bold transition-colors",
                isMobile
                  ? active
                    ? "text-taja-primary"
                    : "text-taja-secondary group-hover:text-taja-primary"
                  : "text-slate-900 group-hover:text-taja-primary"
              )}
            >
              {label}
            </span>
            {description ? (
              <span
                className={cn(
                  "block text-xs mt-0.5 leading-snug",
                  isMobile ? "text-slate-500" : "text-slate-600"
                )}
              >
                {description}
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      </Link>
    </li>
  );
}
