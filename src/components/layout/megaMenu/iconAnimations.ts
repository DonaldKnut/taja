import type { LucideIcon } from "lucide-react";
import type { TargetAndTransition, Transition, Variants } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Key,
  LifeBuoy,
  Package,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  User,
} from "lucide-react";

export type MegaMenuIconName =
  | "ShoppingBag"
  | "Store"
  | "Truck"
  | "LifeBuoy"
  | "BookOpen"
  | "HelpCircle"
  | "Sparkles"
  | "Briefcase"
  | "Key"
  | "Info"
  | "FileText"
  | "Shield"
  | "Rocket"
  | "User"
  | "Globe"
  | "Package"
  | "ChevronDown"
  | "default";

export type IconMotionPreset = {
  /** Continuous subtle motion while idle (respects reduced-motion in component). */
  idle?: TargetAndTransition;
  /** Parent `whileHover="hover"` drives this via child variants. */
  hover: TargetAndTransition;
  /** Panel open / accordion expand entrance. */
  entrance: TargetAndTransition;
  transition?: Transition;
};

const softSpring: Transition = { type: "spring", stiffness: 380, damping: 22 };

const PRESETS: Record<MegaMenuIconName, IconMotionPreset> = {
  ShoppingBag: {
    idle: { rotate: [0, -5, 5, -3, 0], y: [0, -1, 0, -1, 0] },
    hover: { rotate: -10, y: -4, scale: 1.12 },
    entrance: { rotate: -18, y: 8, scale: 0.6 },
    transition: { ...softSpring, duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  Store: {
    idle: { scale: [1, 1.06, 1, 1.04, 1] },
    hover: { scale: 1.15, y: -2 },
    entrance: { scale: 0.5, opacity: 0 },
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  Truck: {
    idle: { x: [0, 4, 0, -3, 0] },
    hover: { x: 8, rotate: -2 },
    entrance: { x: -16, opacity: 0 },
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  LifeBuoy: {
    idle: { rotate: [0, 8, 0, -8, 0] },
    hover: { rotate: 20, scale: 1.1 },
    entrance: { rotate: -90, scale: 0.5 },
    transition: { duration: 5, repeat: Infinity, ease: "linear" },
  },
  BookOpen: {
    idle: { rotate: [0, 6, 0, -5, 0] },
    hover: { rotate: -8, scale: 1.1 },
    entrance: { rotate: 12, scale: 0.7 },
    transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
  },
  HelpCircle: {
    idle: { scale: [1, 1.08, 1, 1.05, 1] },
    hover: { rotate: [0, -12, 12, 0], scale: 1.12 },
    entrance: { scale: 0.4, rotate: 180 },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
  Sparkles: {
    idle: { rotate: [0, 15, -10, 0], scale: [1, 1.1, 0.95, 1] },
    hover: { rotate: 25, scale: 1.2 },
    entrance: { scale: 0, rotate: -40 },
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
  },
  Briefcase: {
    idle: { y: [0, -2, 0, -1, 0] },
    hover: { y: -5, rotate: -4 },
    entrance: { y: 10, scale: 0.65 },
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
  },
  Key: {
    idle: { rotate: [0, -8, 8, -5, 0] },
    hover: { rotate: -18, x: 2 },
    entrance: { rotate: 90, scale: 0.5 },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  Info: {
    idle: { y: [0, -2, 0] },
    hover: { y: -4, scale: 1.12 },
    entrance: { scale: 0.5, opacity: 0 },
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  FileText: {
    idle: { x: [0, 1, 0, -1, 0], y: [0, -1, 0] },
    hover: { x: 3, y: -2, rotate: -3 },
    entrance: { x: -8, opacity: 0 },
    transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut" },
  },
  Shield: {
    idle: { scale: [1, 1.05, 1] },
    hover: { scale: 1.14, y: -2 },
    entrance: { scale: 0.4, y: 6 },
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
  Rocket: {
    idle: { y: [0, -3, 0], rotate: [0, -3, 3, 0] },
    hover: { y: -8, rotate: -12, scale: 1.15 },
    entrance: { y: 14, scale: 0.5 },
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
  User: {
    idle: { y: [0, -1.5, 0] },
    hover: { y: -3, rotate: [0, -6, 6, 0] },
    entrance: { y: 6, scale: 0.7 },
    transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
  },
  Globe: {
    idle: { rotate: [0, 360] },
    hover: { rotate: 420, scale: 1.1 },
    entrance: { rotate: -120, scale: 0.5 },
    transition: { duration: 18, repeat: Infinity, ease: "linear" },
  },
  Package: {
    idle: { y: [0, -2, 0] },
    hover: { y: -4, scale: 1.1 },
    entrance: { scale: 0.6, opacity: 0 },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  ChevronDown: {
    hover: { y: 2 },
    entrance: { rotate: -90, opacity: 0 },
    transition: softSpring,
  },
  default: {
    idle: { scale: [1, 1.05, 1] },
    hover: { scale: 1.1, y: -2 },
    entrance: { scale: 0.7, opacity: 0 },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

/** Stable lookup — minified bundles may strip `displayName`. */
const ICON_REGISTRY = new Map<LucideIcon, MegaMenuIconName>([
  [ShoppingBag, "ShoppingBag"],
  [Store, "Store"],
  [Truck, "Truck"],
  [LifeBuoy, "LifeBuoy"],
  [BookOpen, "BookOpen"],
  [HelpCircle, "HelpCircle"],
  [Sparkles, "Sparkles"],
  [Briefcase, "Briefcase"],
  [Key, "Key"],
  [Info, "Info"],
  [FileText, "FileText"],
  [Shield, "Shield"],
  [Rocket, "Rocket"],
  [User, "User"],
  [Globe, "Globe"],
  [Package, "Package"],
  [ChevronDown, "ChevronDown"],
]);

export function resolveMegaMenuIconName(icon?: LucideIcon | null): MegaMenuIconName {
  if (!icon) return "Package";
  const registered = ICON_REGISTRY.get(icon);
  if (registered) return registered;
  const name = (icon.displayName || (icon as { name?: string }).name || "") as MegaMenuIconName;
  return name in PRESETS ? name : "default";
}

export function getIconMotionPreset(icon?: LucideIcon | null): IconMotionPreset {
  return PRESETS[resolveMegaMenuIconName(icon)];
}

/** Child variants — parent row uses `whileHover="hover"`. */
export function getIconChildVariants(icon?: LucideIcon | null, entranceDelay = 0): Variants {
  const preset = getIconMotionPreset(icon);
  const idleTransition = preset.idle
    ? {
        ...(typeof preset.transition === "object" ? preset.transition : {}),
        repeat: Infinity,
        ease: "easeInOut" as const,
      }
    : (preset.transition ?? softSpring);

  return {
    rest: {
      ...(preset.idle ?? {}),
      opacity: 1,
      transition: preset.idle ? idleTransition : (preset.transition ?? softSpring),
    },
    hover: {
      ...preset.hover,
      transition: { type: "spring", stiffness: 520, damping: 20 },
    },
    entrance: {
      ...preset.entrance,
      opacity: 1,
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 420,
        damping: 22,
        delay: entranceDelay,
      },
    },
  };
}

export function getIdleAnimation(
  icon: LucideIcon | null | undefined,
  reducedMotion: boolean
): TargetAndTransition | false {
  if (reducedMotion) return false;
  const preset = getIconMotionPreset(icon);
  if (!preset.idle) return false;
  return {
    ...preset.idle,
    transition: preset.transition ?? { duration: 3, repeat: Infinity, ease: "easeInOut" },
  };
}

export const megaMenuRowVariants: Variants = {
  rest: {},
  hover: {
    transition: { staggerChildren: 0.04, delayChildren: 0 },
  },
};
