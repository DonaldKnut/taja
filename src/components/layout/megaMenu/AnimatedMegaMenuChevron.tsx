"use client";

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const CHEVRON_VARIANTS: Variants = {
  closed: { rotate: 0, y: 0 },
  open: { rotate: 180, y: 0, transition: { type: "spring", stiffness: 420, damping: 24 } },
  hover: { y: 2, transition: { type: "spring", stiffness: 500, damping: 22 } },
};

export type AnimatedMegaMenuChevronProps = {
  open: boolean;
  className?: string;
  iconClassName?: string;
};

export function AnimatedMegaMenuChevron({ open, className, iconClassName }: AnimatedMegaMenuChevronProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <ChevronDown
        className={cn("shrink-0 opacity-60 transition-transform", open && "rotate-180", className, iconClassName)}
        aria-hidden
      />
    );
  }

  return (
    <motion.span
      className={cn("inline-flex shrink-0 items-center justify-center opacity-60", className)}
      variants={CHEVRON_VARIANTS}
      initial={false}
      animate={open ? "open" : "closed"}
      whileHover="hover"
      aria-hidden
    >
      <ChevronDown className={cn("h-3 w-3 xl:h-3.5 xl:w-3.5", iconClassName)} />
    </motion.span>
  );
}
