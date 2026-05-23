"use client";

import Link from "next/link";
import { ArrowRight, Bike, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout";

/**
 * Homepage band: recruit logistics / delivery partners with clear CTAs.
 */
export function LogisticsPartnerPromo() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden border-y border-emerald-100/60 bg-gradient-to-br from-emerald-50/90 via-white to-slate-50">
      <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-taja-primary/10 blur-2xl" />

      <Container size="lg" className="relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 shadow-sm">
              <Bike className="h-3.5 w-3.5" aria-hidden />
              Logistics partners
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Deliver orders.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-taja-primary">
                Earn on your route.
              </span>
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              We&apos;re growing trusted dispatch coverage for buyers and sellers. Apply to partner with Taja as a rider
              or driver — or sign in if operations has already approved your rider account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
              <Button asChild className="rounded-full px-8 h-12 text-[11px] font-black uppercase tracking-widest shadow-premium">
                <Link href="/logistics/apply">
                  Apply as a partner
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-8 h-12 text-[11px] font-black uppercase tracking-widest border-emerald-200 text-emerald-900 hover:bg-emerald-50">
                <Link href="/logistics/login">Rider portal login</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                Vetted partners
              </li>
              <li className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                Same platform as our shops
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-100/80 bg-white/80 backdrop-blur-sm p-6 md:p-8 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.35)] space-y-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">How it works</p>
            <ol className="space-y-4">
              {[
                "Submit your application — vehicle type and coverage area.",
                "After approval, operations can issue your rider-only login.",
                "Use the rider portal to go online and accept dispatch jobs.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700 leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
              Buyer and seller accounts use the main{" "}
              <Link href="/login" className="font-bold text-taja-primary hover:underline">
                sign in
              </Link>
              . The rider portal is separate for approved logistics partners only.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
