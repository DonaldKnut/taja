"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useMounted } from "./useMounted";

interface ExperimentResponse {
  experiment: string;
  variant: string;
  expiresAt?: string;
}

export function useExperiment(experimentKey: string, fallbackVariant: string = "control") {
  const storageKey = `taja:experiment:${experimentKey}`;
  const mounted = useMounted();
  // Initialize with fallback to prevent hydration mismatch
  const [variant, setVariant] = useState<string>(fallbackVariant);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    if (!mounted) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setVariant(stored);
      setLoading(false);
    }
  }, [mounted, storageKey]);

  const fetchVariant = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = (await api(`/api/experiments/${experimentKey}`)) as { data?: ExperimentResponse } | ExperimentResponse;
      const payload = "data" in response ? response.data : response;
      const resolvedVariant = (payload && "variant" in payload ? payload.variant : null) || fallbackVariant;

      setVariant(resolvedVariant);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, resolvedVariant);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(err?.message ?? "Failed to load experiment variant"));
    } finally {
      setLoading(false);
    }
  }, [experimentKey, fallbackVariant, storageKey]);

  useEffect(() => {
    if (!mounted) return;
    fetchVariant();
    // only run once on mount when experiment key changes
  }, [mounted, fetchVariant]);

  const memo = useMemo(
    () => ({
      variant,
      loading,
      error,
      refresh: fetchVariant,
    }),
    [variant, loading, error, fetchVariant]
  );

  return memo;
}





