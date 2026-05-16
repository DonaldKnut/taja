"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedMegaMenuIcon } from "./AnimatedMegaMenuIcon";

export type MegaMenuSectionIconProps = {
  icon?: LucideIcon;
  expanded?: boolean;
  className?: string;
  variant?: "app" | "home";
};

export function MegaMenuSectionIcon({
  icon: Icon,
  expanded = false,
  className,
  variant = "app",
}: MegaMenuSectionIconProps) {
  const Resolved = Icon ?? Package;
  const isHome = variant === "home";
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
        isHome ? "bg-white/70 text-taja-secondary" : "bg-taja-light/60 text-taja-secondary",
        className
      )}
      animate={
        reducedMotion || !expanded ? { scale: 1 } : { scale: [1, 1.06, 1], transition: { duration: 0.45 } }
      }
    >
      <AnimatedMegaMenuIcon
        icon={Resolved}
        size="sm"
        playEntrance={expanded}
        className="text-taja-secondary"
      />
    </motion.div>
  );
}
