"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getIconChildVariants } from "./iconAnimations";

const SIZE_CLASS = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

const REDUCED_VARIANTS = {
  rest: { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 },
  hover: { scale: 1.05 },
  entrance: { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 },
};

export type AnimatedMegaMenuIconProps = {
  icon: LucideIcon;
  className?: string;
  size?: keyof typeof SIZE_CLASS;
  entranceDelay?: number;
  playEntrance?: boolean;
  /** Change to replay entrance (e.g. accordion expand). */
  entranceKey?: string;
  active?: boolean;
  badge?: boolean;
};

export function AnimatedMegaMenuIcon({
  icon: Icon,
  className,
  size = "sm",
  entranceDelay = 0,
  playEntrance = false,
  entranceKey,
  active = false,
  badge = false,
}: AnimatedMegaMenuIconProps) {
  const reducedMotion = useReducedMotion();
  const variants = useMemo(
    () => (reducedMotion ? REDUCED_VARIANTS : getIconChildVariants(Icon, entranceDelay)),
    [Icon, entranceDelay, reducedMotion]
  );

  return (
    <motion.span
      key={entranceKey ?? (playEntrance ? "entrance" : "static")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        badge && "h-8 w-8 rounded-lg",
        badge &&
          (active
            ? "bg-taja-primary text-white"
            : "bg-white border border-slate-100 text-slate-400 group-hover:text-taja-primary"),
        !badge && "h-auto w-auto"
      )}
      variants={variants}
      initial={playEntrance ? "entrance" : false}
      animate="rest"
      aria-hidden
    >
      <Icon
        className={cn(
          SIZE_CLASS[size],
          "transition-colors duration-200",
          !badge && "text-slate-400 group-hover:text-taja-primary",
          active && badge && "text-white",
          className
        )}
      />
    </motion.span>
  );
}
