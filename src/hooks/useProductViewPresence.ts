"use client";

import { useCallback, useEffect, useState } from "react";

const VIEWER_STORAGE_PREFIX = "taja_product_viewer_";

/** localStorage so all tabs share one viewer id (closer to “people” count, not tabs). */
function getOrCreateViewerId(productId: string): string {
  if (typeof window === "undefined") return "";
  const key = `${VIEWER_STORAGE_PREFIX}${productId}`;
  let id: string | null = null;
  try {
    id = localStorage.getItem(key);
  } catch {
    id = null;
  }
  if (!id) {
    try {
      id = sessionStorage.getItem(key);
    } catch {
      id = null;
    }
  }
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    try {
      localStorage.setItem(key, id);
    } catch {
      /* private mode: fall back to session-only */
      try {
        sessionStorage.setItem(key, id);
      } catch {
        /* ignore */
      }
    }
  }
  return id;
}

export function useProductViewPresence(productId: string | undefined, initialViews?: number) {
  const [totalViewing, setTotalViewing] = useState(0);
  const [totalViews, setTotalViews] = useState(() =>
    typeof initialViews === "number" && Number.isFinite(initialViews) ? Math.max(0, Math.floor(initialViews)) : 0
  );

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
      const v = Number(json?.data?.totalViews ?? 0);
      if (Number.isFinite(v) && v >= 0) {
        setTotalViews((prev) => Math.max(prev, v));
      }
    } catch {
      /* ignore */
    }
  }, [productId]);

  useEffect(() => {
    if (typeof initialViews === "number" && Number.isFinite(initialViews)) {
      setTotalViews((v) => Math.max(v, Math.floor(initialViews)));
    }
  }, [initialViews]);

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

  return { totalViewing, totalViews, beat };
}
