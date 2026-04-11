"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useCallback } from "react";
import {
  Compass,
  Plus,
  ShoppingBag,
  User,
  Package,
  LogIn,
  UserPlus,
  ShoppingCart,
  Heart,
  MessageCircle,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/components/wishlist";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  activeMatch?: (pathname: string) => boolean;
  onClick?: (e: React.MouseEvent) => void;
};

function isActive(pathname: string, item: NavItem) {
  if (item.activeMatch) return item.activeMatch(pathname);
  if (pathname === item.href) return true;
  return pathname.startsWith(item.href + "/");
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { toggleCart, getTotalItems } = useCartStore();
  const cartCount = getTotalItems();
  const { toggleDrawer: toggleWishlist, items: wishlistItems } = useWishlistStore();
  const wishlistCount = wishlistItems.length;

  // Hide on auth flows and payment redirects where a fixed bar is distracting.
  const hiddenPrefixes = [
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/auth/oauth-success",
    "/verify-email",
  ];
  const hidden = hiddenPrefixes.some((p) => pathname.startsWith(p));

  const role = user?.role;

  const unauthItems: NavItem[] = [
    { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
    { label: "Login", href: "/login", icon: LogIn, activeMatch: (p) => p.startsWith("/login") || p.startsWith("/(auth)/login") },
    { label: "Register", href: "/register", icon: UserPlus },
  ];

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleCart();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist();
  };

  const buyerItems: NavItem[] = [
    { label: "Marketplace", href: "/dashboard/marketplace", icon: ShoppingBag },
    { label: "Orders", href: "/dashboard/orders", icon: Package },
    { label: "Cart", href: "/dashboard/cart", icon: ShoppingCart, onClick: handleCartClick },
    { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart, onClick: handleWishlistClick },
    { label: "Chat", href: "/chat", icon: MessageCircle },
  ];

  const sellerItems: NavItem[] = [
    { label: "Marketplace", href: "/seller/marketplace", icon: ShoppingBag },
    { label: "Orders", href: "/seller/orders", icon: Package },
    { label: "Plus", href: "/seller/products/new", icon: Plus },
    { label: "Chat", href: "/chat", icon: MessageCircle },
    { label: "Wallet", href: "/seller/wallet", icon: DollarSign, activeMatch: (p) => p.startsWith("/seller/wallet") },
  ];

  const sellerNeedsKyc =
    !!user &&
    (user as any).role === "seller" &&
    ((user as any).kyc?.status === "not_started" ||
      (user as any).kyc?.status === "pending" ||
      !(user as any).kyc?.status);

  const finalSellerItems: NavItem[] = sellerNeedsKyc
    ? [
        ...sellerItems,
        {
          label: "Verify",
          href: "/onboarding/kyc",
          icon: User,
          activeMatch: (p) => p.startsWith("/onboarding/kyc") || p.startsWith("/seller/verification"),
        },
      ]
    : sellerItems;

  const items = !isAuthenticated ? unauthItems : role === "seller" ? finalSellerItems : buyerItems;

  const navRef = useRef<HTMLElement | null>(null);

  const publishNavHeight = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    document.documentElement.style.setProperty(
      "--mobile-bottom-nav-height",
      `${el.offsetHeight}px`
    );
  }, []);

  useLayoutEffect(() => {
    if (hidden) {
      document.documentElement.style.removeProperty("--mobile-bottom-nav-height");
      return;
    }
    const el = navRef.current;
    if (!el) return;
    publishNavHeight();
    const ro = new ResizeObserver(() => publishNavHeight());
    ro.observe(el);
    window.addEventListener("resize", publishNavHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publishNavHeight);
      document.documentElement.style.removeProperty("--mobile-bottom-nav-height");
    };
  }, [hidden, publishNavHeight, items.length, cartCount, wishlistCount]);

  if (hidden) return null;

  return (
    <nav
      ref={navRef}
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
            const isCart = item.label === "Cart";

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={item.onClick}
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
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${active ? "text-taja-primary" : "text-gray-400"}`} />
                    {isCart && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                        {cartCount}
                      </span>
                    )}
                    {item.label === "Wishlist" && wishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                        {wishlistCount}
                      </span>
                    )}
                    <span className="sr-only">{item.label}</span>
                  </div>
                )}
                {!isPlus && (
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1 hidden min-[400px]:block translate-y-0.5">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
