"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Search, Home, ShoppingBag, HelpCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFoundPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const dashboardHref = user?.role === "seller" ? "/seller/dashboard" : "/dashboard";
  const quickLinks = [
    { href: "/marketplace", label: "Browse Marketplace", icon: ShoppingBag },
    { href: dashboardHref, label: "Go to Dashboard", icon: Home },
    { href: "/how-it-works", label: "How Taja.Shop Works", icon: HelpCircle },
  ];

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/marketplace?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" variant="header" />
          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              Return to Marketplace
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-emerald-100/70 bg-white/90 p-8 shadow-xl shadow-emerald-100/40 backdrop-blur">
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            404 • Page Not Found
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Oops! We can’t find what you’re looking for.
          </h1>
          <p className="max-w-2xl text-base text-gray-600 sm:text-lg">
            The page may have been moved, deleted, or you may have typed the wrong link. Try a product search or jump back into the sections below.
          </p>

          <form onSubmit={onSearch} className="flex w-full max-w-xl items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for products, shops or categories"
                className="pl-10 pr-4"
                aria-label="Search marketplace"
              />
            </div>
            <Button type="submit" className="whitespace-nowrap">
              Search
            </Button>
          </form>

          <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-500">Open {link.href}</p>
                </div>
                <link.icon className="h-5 w-5 text-emerald-500 transition group-hover:text-emerald-600" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-gray-500">
          <span>Need help?</span>
          <Link href="mailto:support@taja.shop" className="font-medium text-emerald-700 hover:text-emerald-800">
            Email support@taja.shop
          </Link>
          <span>or</span>
          <Link href="/shops" className="font-medium text-emerald-700 hover:text-emerald-800">
            explore shops near you
          </Link>
        </div>
      </main>
    </div>
  );
}

