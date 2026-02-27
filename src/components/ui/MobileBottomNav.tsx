"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Plus,
  ShoppingBag,
  User,
  Wallet,
  ShieldCheck,
  Package,
  LogIn,
  UserPlus,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  activeMatch?: (pathname: string) => boolean;
};

function isActive(pathname: string, item: NavItem) {
  if (item.activeMatch) return item.activeMatch(pathname);
  if (pathname === item.href) return true;
  return pathname.startsWith(item.href + "/");
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Hide on auth flows and payment redirects where a fixed bar is distracting.
  const hiddenPrefixes = [
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/auth/oauth-success",
    "/verify-email",
  ];
  if (hiddenPrefixes.some((p) => pathname.startsWith(p))) return null;

  const role = user?.role;

  const unauthItems: NavItem[] = [
    { label: "Explore", href: "/marketplace", icon: Compass },
    { label: "Login", href: "/login", icon: LogIn, activeMatch: (p) => p.startsWith("/login") || p.startsWith("/(auth)/login") },
    { label: "Register", href: "/register", icon: UserPlus },
  ];

  const buyerItems: NavItem[] = [
    { label: "Explore", href: "/marketplace", icon: Compass },
    { label: "Orders", href: "/dashboard/orders", icon: Package },
    { label: "Cart", href: "/dashboard/cart", icon: ShoppingCart },
    { label: "Wishlist", href: "/dashboard/wishlist", icon: ShoppingBag },
    { label: "Profile", href: "/dashboard/profile", icon: User },
  ];

  const sellerItems: NavItem[] = [
    { label: "Marketplace", href: "/seller/marketplace", icon: ShoppingBag },
    { label: "Orders", href: "/seller/orders", icon: Package },
    { label: "Plus", href: "/seller/products/new", icon: Plus },
    { label: "Products", href: "/seller/products", icon: ShoppingBag, activeMatch: (p) => p.startsWith("/seller/products") },
    { label: "Verify", href: "/onboarding/kyc", icon: ShieldCheck, activeMatch: (p) => p.startsWith("/onboarding/kyc") || p.startsWith("/seller/verification") },
  ];

  const items = !isAuthenticated ? unauthItems : role === "seller" ? sellerItems : buyerItems;

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-white/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto max-w-7xl px-2">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item, index) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            const isPlus = item.label === "Plus";
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-3.5 rounded-xl transition-colors ${isPlus
                  ? "relative -mt-4"
                  : active
                    ? "text-taja-primary"
                    : "text-gray-500 hover:text-taja-secondary"
                  }`}
                aria-current={active ? "page" : undefined}
              >
                {isPlus ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-taja-primary text-white shadow-emerald">
                    <Plus className="h-6 w-6" />
                  </div>
                ) : (
                  <>
                    <Icon className={`h-5 w-5 ${active ? "text-taja-primary" : "text-gray-400"}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

