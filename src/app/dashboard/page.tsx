"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ShoppingBag, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

/**
 * Buyer “home” inside /dashboard. Full activity overview is not shipped yet;
 * marketplace and orders live on dedicated routes from the sidebar.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === "seller") {
      router.replace("/seller/dashboard");
      return;
    }
    if (user.role === "admin") {
      router.replace("/dashboard/marketplace");
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-500 text-sm">
        <div className="h-10 w-10 border-2 border-gray-200 border-t-taja-primary rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  if (user.role === "seller") {
    return (
      <div className="h-[40vh] flex items-center justify-center text-sm text-gray-500">
        Redirecting to seller dashboard…
      </div>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="h-[40vh] flex items-center justify-center text-sm text-gray-500">
        Opening marketplace…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-12 px-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-8 sm:p-10 shadow-lg shadow-emerald-900/5 text-center"
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-taja-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-950 text-emerald-400 mx-auto shadow-inner">
            <LayoutDashboard className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-taja-primary">
              Buyer dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-taja-secondary tracking-tight">
              Overview coming soon
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              We&apos;re building a personal home for your orders, spending insights, and
              recommendations. Until then, use{" "}
              <span className="font-semibold text-gray-800">Marketplace</span> and{" "}
              <span className="font-semibold text-gray-800">Orders</span> from the menu — those
              already work.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/marketplace" className="sm:flex-1 sm:max-w-[220px]">
              <Button className="w-full h-12 rounded-xl bg-emerald-950 text-white hover:bg-emerald-900 font-bold gap-2 shadow-md">
                <ShoppingBag className="h-4 w-4" />
                Go to marketplace
                <ArrowRight className="h-4 w-4 opacity-80" />
              </Button>
            </Link>
            <Link href="/dashboard/orders" className="sm:flex-1 sm:max-w-[200px]">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-emerald-200 text-emerald-900 font-semibold hover:bg-emerald-50"
              >
                My orders
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 pt-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            You&apos;ll see activity snapshots here in a future update.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
