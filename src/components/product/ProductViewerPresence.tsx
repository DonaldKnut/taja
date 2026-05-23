"use client";

import { useEffect, useRef, useState } from "react";
import { Users, X } from "lucide-react";

const DISMISS_PREFIX = "taja_presence_dismiss_";
const DISMISS_MS = 10 * 60 * 1000;

function isDismissed(productId: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(`${DISMISS_PREFIX}${productId}`);
  if (!raw) return false;
  const t = Number(raw);
  return Number.isFinite(t) && Date.now() < t;
}

function dismiss(productId: string) {
  sessionStorage.setItem(`${DISMISS_PREFIX}${productId}`, String(Date.now() + DISMISS_MS));
}

type Props = {
  productId: string | undefined;
  /** From parent `useProductViewPresence` — avoids a second heartbeat. */
  totalViewing: number;
};

/**
 * Modal when several people view at once. Parent runs `useProductViewPresence`.
 */
export function ProductViewerPresence({ productId, totalViewing }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!productId) return;
    if (totalViewing > 1 && !isDismissed(productId) && !shownRef.current) {
      shownRef.current = true;
      setModalOpen(true);
    }
  }, [productId, totalViewing]);

  if (!productId || !modalOpen || totalViewing <= 1) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center sm:items-center p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md w-full rounded-2xl border border-emerald-100 bg-white shadow-xl shadow-emerald-900/10 p-5 transition-all duration-200 scale-100 opacity-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Popular right now</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {totalViewing} people are viewing this product at the same time — including you.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => {
              dismiss(productId);
              setModalOpen(false);
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
