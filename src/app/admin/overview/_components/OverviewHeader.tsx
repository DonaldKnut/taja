"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function OverviewHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm font-bold text-slate-500 max-w-2xl">{subtitle}</p>
      ) : null}
    </div>
  );
}
