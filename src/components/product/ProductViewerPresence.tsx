"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users, X } from "lucide-react";

const VIEWER_STORAGE_PREFIX = "taja_product_viewer_";
const DISMISS_PREFIX = "taja_presence_dismiss_";
const DISMISS_MS = 10 * 60 * 1000;

function getOrCreateViewerId(productId: string): string {
  if (typeof window === "undefined") return "";
  const key = `${VIEWER_STORAGE_PREFIX}${productId}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

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
};

/**
 * Periodic heartbeats + modal when multiple people are viewing (Mongo-backed).
 */
export function ProductViewerPresence({ productId }: Props) {
  const [totalViewing, setTotalViewing] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const shownRef = useRef(false);

  const beat = useCallback(async () => {
    if (!productId) return;
    const viewerId = getOrCreateViewerId(productId);
    if (!viewerId) return;
    try {
      const res = await fetch(`/api/products/${productId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerId }),
      });
      const json = await res.json();
      if (!json?.success) return;
      const total = Number(json?.data?.totalViewing ?? 0);
      setTotalViewing(total);
      if (total > 1 && !isDismissed(productId) && !shownRef.current) {
        shownRef.current = true;
        setModalOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    beat();
    const t = window.setInterval(beat, 20_000);
    return () => window.clearInterval(t);
  }, [productId, beat]);

  useEffect(() => {
    if (!productId) return;
    const onVis = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [productId, beat]);

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
