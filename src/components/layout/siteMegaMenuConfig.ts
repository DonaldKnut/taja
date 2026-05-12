/**
 * Shared marketing / discovery navigation for mega menu + mobile drawers.
 * Keep hrefs aligned with real routes as the product grows.
 */

import {
  ShoppingBag,
  Store,
  Truck,
  LifeBuoy,
  BookOpen,
  HelpCircle,
  Sparkles,
  Briefcase,
  Key,
  Info,
  FileText,
  Shield,
  Rocket,
  User,
  Globe,
} from "lucide-react";

export type MegaMenuId = "shop" | "discover" | "logistics" | "company";

export type MegaMenuLink = {
  label: string;
  href: string;
  description?: string;
  icon?: any;
};

export type MegaMenuColumn = {
  heading: string;
  links: MegaMenuLink[];
};

export type MegaMenuSection = {
  id: MegaMenuId;
  label: string;
  eyebrow: string;
  icon: any;
  columns: MegaMenuColumn[];
};

export const SITE_MEGA_MENU: MegaMenuSection[] = [
  {
    id: "shop",
    label: "Shop",
    eyebrow: "Buy with confidence",
    icon: ShoppingBag,
    columns: [
      {
        heading: "Browse",
        links: [
          { label: "Marketplace", href: "/marketplace", description: "Search products across all shops", icon: Globe },
          { label: "Shops", href: "/shops", description: "Discover trusted storefronts", icon: Store },
        ],
      },
      {
        heading: "After you buy",
        links: [
          { label: "Shipping & delivery", href: "/shipping", description: "How orders reach you", icon: Truck },
          { label: "Support", href: "/support", description: "Help with orders and account", icon: LifeBuoy },
        ],
      },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    eyebrow: "Learn and explore",
    icon: Sparkles,
    columns: [
      {
        heading: "Editorial",
        links: [
          { label: "Journal", href: "/blog", description: "Stories, drops, and seller spotlights", icon: BookOpen },
          { label: "How it works", href: "/how-it-works", description: "Buyers, sellers, and payouts", icon: HelpCircle },
        ],
      },
      {
        heading: "Tools",
        links: [{ label: "AI shopping assistant", href: "/ai", description: "Ideas and product discovery", icon: Sparkles }],
      },
    ],
  },
  {
    id: "logistics",
    label: "Logistics",
    eyebrow: "Deliver with Taja",
    icon: Truck,
    columns: [
      {
        heading: "Partners",
        links: [
          {
            label: "Apply as a delivery partner",
            href: "/logistics/apply",
            description: "Bikes to trucks — earn on your schedule",
            icon: Briefcase,
          },
          {
            label: "Rider portal login",
            href: "/logistics/login",
            description: "For approved partners with rider access",
            icon: Key,
          },
        ],
      },
      {
        heading: "Operations",
        links: [{ label: "Shipping overview", href: "/shipping", description: "Customer-facing delivery policy", icon: Info }],
      },
    ],
  },
  {
    id: "company",
    label: "Company",
    eyebrow: "Trust & policies",
    icon: Shield,
    columns: [
      {
        heading: "Legal",
        links: [
          { label: "Terms of service", href: "/terms", icon: FileText },
          { label: "Privacy policy", href: "/privacy", icon: Shield },
        ],
      },
      {
        heading: "Sell on Taja",
        links: [
          { label: "Open your shop", href: "/register", description: "Create a seller account", icon: Rocket },
          { label: "Sign in", href: "/login", description: "Buyers and sellers", icon: User },
        ],
      },
    ],
  },
];

export function isMegaMenuActive(pathname: string, sectionId: MegaMenuId): boolean {
  if (sectionId === "shop") {
    return (
      pathname.startsWith("/marketplace") ||
      pathname.startsWith("/shops") ||
      pathname.startsWith("/shipping")
    );
  }
  if (sectionId === "discover") {
    return pathname.startsWith("/blog") || pathname.startsWith("/how-it-works") || pathname.startsWith("/ai");
  }
  if (sectionId === "logistics") {
    return pathname.startsWith("/logistics");
  }
  if (sectionId === "company") {
    return pathname.startsWith("/terms") || pathname.startsWith("/privacy") || pathname.startsWith("/support");
  }
  return false;
}
