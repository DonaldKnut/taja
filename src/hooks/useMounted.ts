"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if component has mounted (client-side only)
 * Prevents hydration mismatches by ensuring client-only code runs after hydration
 * 
 * @example
 * const mounted = useMounted();
 * if (!mounted) return null; // or return a loading state
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

