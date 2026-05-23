"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShoppingBag,
  Store,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function SellerHomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && user?.role === "seller") {
      router.replace("/seller/dashboard");
      return;
    }
    if (isAuthenticated && user?.role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [loading, isAuthenticated, user?.role, router]);

  const showRedirectSplash =
    loading || (isAuthenticated && (user?.role === "seller" || user?.role === "admin"));

  if (showRedirectSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex flex-col items-center justify-center gap-6 px-6">
        <Logo size="lg" variant="header" href="/" />
        <div
          className="h-9 w-9 rounded-full border-2 border-taja-primary border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">
          {user?.role === "seller" ? "Opening your dashboard…" : "Loading…"}
        </p>
      </div>
    );
  }

  const buyerReady = isAuthenticated && user && user.role === "buyer";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/80 to-white text-taja-secondary">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/85 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="lg" variant="header" href="/" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/marketplace"
              className="hidden text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-taja-primary sm:inline"
            >
              Marketplace
            </Link>
            {buyerReady ? (
              <>
                <Button variant="outline" size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest">
                  <Link href="/dashboard">Buyer home</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest shadow-premium">
                  <Link href="/seller/setup">Open shop setup</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-widest shadow-premium">
                  <Link href="/register">Start selling</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            {buyerReady ? "Sell alongside shopping" : "Seller hub"}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-taja-secondary sm:text-5xl sm:leading-[1.1]">
            {buyerReady ? (
              <>Turn your catalog into a storefront on Taja</>
            ) : (
              <>Everything you need to sell with confidence</>
            )}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
            {buyerReady ? (
              <>
                You&apos;re already signed in. Finish shop setup to list products, take orders, and
                get paid—without creating a new account.
              </>
            ) : (
              <>
                Join thousands of sellers reaching buyers across Nigeria. List products, verify your
                business, and track orders from one dashboard.
              </>
            )}
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {buyerReady ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-2xl px-8 text-xs font-black uppercase tracking-widest shadow-premium"
                >
                  <Link href="/seller/setup" className="inline-flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Continue shop setup
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest">
                  <Link href="/onboarding/role-selection" className="inline-flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Switch to seller account
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-2xl px-8 text-xs font-black uppercase tracking-widest shadow-premium"
                >
                  <Link href="/register" className="inline-flex items-center gap-2">
                    Create seller account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-14 rounded-2xl text-xs font-black uppercase tracking-widest">
                  <Link href="/login" className="inline-flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    I already have an account
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Guest-only: discovery strip */}
        {!buyerReady && (
          <section className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Verified & secure",
                body: "KYC and escrow-friendly flows help buyers trust your shop.",
              },
              {
                icon: TrendingUp,
                title: "Grow faster",
                body: "Analytics, orders, and payouts in one seller workspace.",
              },
              {
                icon: ShoppingBag,
                title: "Your storefront",
                body: "Custom shop link, catalog, and messaging with customers.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition hover:border-emerald-200/60 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wide text-taja-secondary">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </section>
        )}

        {/* Buyer authed: next steps only (no fake dashboard tiles) */}
        {buyerReady && (
          <section className="mt-16 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-8 sm:p-10">
            <h2 className="text-center text-xs font-black uppercase tracking-[0.3em] text-emerald-700">Next steps</h2>
            <ul className="mx-auto mt-8 max-w-lg space-y-4 text-left text-sm font-medium text-gray-700">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                  1
                </span>
                <span>
                  <Link href="/seller/setup" className="font-bold text-taja-primary hover:underline">
                    Complete shop setup
                  </Link>{" "}
                  — name, categories, and profile buyers will see.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                  2
                </span>
                <span>
                  Finish{" "}
                  <Link href="/onboarding/kyc" className="font-bold text-taja-primary hover:underline">
                    identity verification
                  </Link>{" "}
                  when prompted so you can publish listings.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                  3
                </span>
                <span>
                  Add your first product from the seller dashboard after approval.
                </span>
              </li>
            </ul>
            <div className="mt-10 flex justify-center">
              <Link
                href="/how-it-works"
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest text-gray-500",
                  "hover:text-taja-primary"
                )}
              >
                How selling on Taja works →
              </Link>
            </div>
          </section>
        )}

        {!buyerReady && (
          <p className="mt-14 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <Link href="/how-it-works" className="hover:text-taja-primary">
              How it works
            </Link>
            <span className="mx-2">·</span>
            <Link href="/shops" className="hover:text-taja-primary">
              Browse shops
            </Link>
            <span className="mx-2">·</span>
            <Link href="/marketplace" className="hover:text-taja-primary">
              Marketplace
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
