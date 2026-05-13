"use client";

import { Eye, Users } from "lucide-react";
import { formatViewCount } from "@/lib/formatViewCount";
import { cn } from "@/lib/utils";

type Props = {
  totalViews: number;
  totalViewing: number;
  className?: string;
};

/**
 * Lifetime views + concurrent viewers (parent supplies values from `useProductViewPresence`).
 */
export function ProductViewsLive({ totalViews, totalViewing, className }: Props) {
  const safeViews = typeof totalViews === "number" && Number.isFinite(totalViews) ? Math.max(0, Math.floor(totalViews)) : 0;
  const viewsLabel = `${formatViewCount(safeViews)} view${safeViews === 1 ? "" : "s"}`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-500",
        className
      )}
    >
      <span
        className="inline-flex items-center gap-1.5"
        title="Approximate product page opens (same browser won’t add another count for ~12 hours)"
      >
        <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        <span className="tabular-nums">{viewsLabel}</span>
      </span>
      {totalViewing >= 2 ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 px-2.5 py-0.5 text-emerald-800 border border-emerald-100"
          title="Tabs/devices with a recent heartbeat (~45s window)"
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="tabular-nums font-bold">{totalViewing} viewing now</span>
        </span>
      ) : null}
    </div>
  );
}
