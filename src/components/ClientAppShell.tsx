"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";
import { CartDrawer, useCartStore } from "@/components/cart";
import { WishlistDrawer } from "@/components/wishlist/WishlistDrawer";

interface ClientAppShellProps {
  children: React.ReactNode;
}

const AUTH_ROUTES_WITHOUT_PROVIDERS = [
  // Removed /login because it now needs AuthProvider for useAuth()
  // Removed /register because it now needs AuthProvider for useAuth()
  "/forgot-password",
  "/reset-password",
  // Note: /auth/callback is NOT in this list because it needs AuthProvider
  // to call refreshUser() after OAuth completes
];

/**
 * Client app shell with conditional providers:
 * - Most auth-related routes get a minimal shell (no Providers) to avoid
 *   triggering the webpack runtime bug we've seen on some routes.
 * - /login, /register and all other routes get the full Providers tree (Auth + ErrorBoundary).
 *
 * This ensures most auth pages stay stable while login, register and the rest of the app
 * can use AuthContext and error boundaries.
 */
export function ClientAppShell({ children }: ClientAppShellProps) {
  const pathname = usePathname();
  const isAuthRouteWithoutProviders =
    typeof pathname === "string" &&
    AUTH_ROUTES_WITHOUT_PROVIDERS.some((route) => pathname.startsWith(route));

  // Minimal shell for specific auth routes (no Providers, no global cart/toaster/PWA)
  if (isAuthRouteWithoutProviders) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-taja-light to-white">
          {children}
        </div>
        <Toaster
          position="top-center"
          containerClassName="toast-glass-container"
          toastOptions={{
            className: "toast-glass",
            success: { className: "toast-glass toast-glass-success" },
            error: { className: "toast-glass toast-glass-error" },
            loading: { className: "toast-glass toast-glass-loading" },
            duration: 4000,
          }}
        />
      </>
    );
  }

  // Full shell for all other routes (including /login which needs AuthProvider)
  return (
    <Providers>
      <CartShell children={children} />
    </Providers>
  );
}

function CartShell({ children }: { children: React.ReactNode }) {
  const { isOpen, toggleCart } = useCartStore();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-taja-light to-white pb-24 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
      <CartDrawer isOpen={isOpen} onClose={toggleCart} />
      <WishlistDrawer />
      <Toaster
        position="top-center"
        containerClassName="toast-glass-container"
        toastOptions={{
          className: "toast-glass",
          success: { className: "toast-glass toast-glass-success" },
          error: { className: "toast-glass toast-glass-error" },
          loading: { className: "toast-glass toast-glass-loading" },
          duration: 4000,
        }}
      />
    </>
  );
}




