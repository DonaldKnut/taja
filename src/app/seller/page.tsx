"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Settings, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function SellerHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="lg" variant="header" />
          <Link
            href="/register"
            className="bg-gradient-taja text-white px-5 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Start Selling
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-taja text-white text-sm font-medium mb-4">
            <ShoppingBag className="h-4 w-4" />
            <span>Seller Center</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Manage your shop in one place
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Set up your shop, list products, verify your account, and track orders.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/seller/dashboard"
            className="group rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition bg-white"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-taja-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Seller Dashboard</h2>
            <p className="text-gray-600 mb-4">Overview of your sales, orders, and performance.</p>
            <span className="inline-flex items-center text-taja-primary font-medium">
              Open Dashboard <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </Link>

          <Link
            href="/seller/products/new"
            className="group rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition bg-white"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-taja-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create Product</h2>
            <p className="text-gray-600 mb-4">Add new products with photos, prices, and stock.</p>
            <span className="inline-flex items-center text-taja-primary font-medium">
              Add Product <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </Link>

          <Link
            href="/seller/verification"
            className="group rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition bg-white"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-taja-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification</h2>
            <p className="text-gray-600 mb-4">Verify your identity to unlock trust badges.</p>
            <span className="inline-flex items-center text-taja-primary font-medium">
              Get Verified <ArrowRight className="h-4 w-4 ml-1" />
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}






