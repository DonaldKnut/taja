"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Product, Shop } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface MarketplaceFeedOptions {
  category?: string;
  limit?: number;
  search?: string;
  shop?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  signal?: AbortSignal;
}

interface MarketplaceFeedResponse {
  products: Product[];
  recommendedShops?: Shop[];
  categories?: string[];
  savedFilters?: string[];
  personalizedHeadline?: string;
  experimentVariant?: string;
}

const fallbackCategories = [
  "Fashion",
  "Electronics",
  "Home & Living",
  "Beauty",
  "Sports",
  "Accessories",
  "Books",
  "Art & Crafts",
];

export function useMarketplaceFeed(options: MarketplaceFeedOptions = {}) {
  const { category, limit, search, shop, seller, minPrice, maxPrice, verifiedOnly } = options;
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<MarketplaceFeedResponse>({
    products: [],
    categories: fallbackCategories,
    recommendedShops: [],
    savedFilters: [],
    personalizedHeadline: undefined,
    experimentVariant: "control",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeed = useCallback(
    async (abortSignal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        // Fetch marketplace feed endpoint with server-side filtering.
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (search) params.append("search", search);
        if (shop) params.append("shop", shop);
        if (seller) params.append("seller", seller);
        if (typeof minPrice === "number" && !Number.isNaN(minPrice)) {
          params.append("minPrice", `${minPrice}`);
        }
        if (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) {
          params.append("maxPrice", `${maxPrice}`);
        }
        if (verifiedOnly) params.append("verifiedOnly", "true");
        params.append("limit", `${limit ?? 50}`);
        if (isAuthenticated && user?._id) params.append("userId", user._id);
        if (isAuthenticated && (user as any)?.role === "seller") params.append("includeMine", "true");

        const response = await api(`/api/marketplace/feed?${params.toString()}`, {
          signal: abortSignal,
        } as any);

        // Handle response structure: API returns { success: true, data: { products: [...] } }
        // The api() function returns the full response, so we need to extract data
        let payload: MarketplaceFeedResponse;

        if (response?.success && response?.data) {
          // Standard API response format: { success: true, data: { products: [...] } }
          payload = response.data as MarketplaceFeedResponse;
        } else if (response?.products) {
          // Direct products array or object with products property
          payload = response as MarketplaceFeedResponse;
        } else if (response?.data?.products) {
          // Nested data structure
          payload = response.data as MarketplaceFeedResponse;
        } else {
          // Fallback: treat response as payload
          payload = response as MarketplaceFeedResponse;
        }

        const products = payload?.products || [];

        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[useMarketplaceFeed] API Response:', {
            hasResponse: !!response,
            responseKeys: response ? Object.keys(response) : [],
            hasData: !!response?.data,
            hasSuccess: !!response?.success,
            productsCount: products.length,
            payloadKeys: payload ? Object.keys(payload) : [],
            firstProduct: products[0] ? { id: products[0]._id, title: products[0].title } : null,
          });
        }

        // Always update products, even if empty (to clear fallback products)
        setData({
          products: products,
          recommendedShops: payload?.recommendedShops ?? [],
          categories: payload?.categories ?? fallbackCategories,
          savedFilters: payload?.savedFilters ?? [],
          personalizedHeadline: payload?.personalizedHeadline,
          experimentVariant: payload?.experimentVariant ?? "control",
        });
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return;
        }

        // Enhanced error logging
        console.error('[useMarketplaceFeed] Error:', {
          message: err?.message,
          status: err?.status,
          data: err?.data,
          stack: err?.stack,
        });

        setError(err instanceof Error ? err : new Error(err?.message ?? "Failed to load marketplace feed"));
        setData((prev) => ({
          ...prev,
          experimentVariant: prev.experimentVariant ?? "control",
        }));
      } finally {
        setLoading(false);
      }
    },
    [category, limit, search, shop, seller, minPrice, maxPrice, verifiedOnly, isAuthenticated, user?._id]
  );

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    fetchFeed(controller.signal).catch((err) => {
      // Silently handle abort errors - they're expected
      if (err?.name !== "AbortError" && isMounted) {
        console.error('[useMarketplaceFeed] Unhandled error in useEffect:', err);
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchFeed]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    fetchFeed(controller.signal).catch((err) => {
      // Silently handle abort errors
      if (err?.name !== "AbortError") {
        console.error('[useMarketplaceFeed] Unhandled error in refetch:', err);
      }
    });
    // Note: We don't return cleanup for refetch as it's manual
  }, [fetchFeed]);

  const memoized = useMemo(
    () => ({
      ...data,
      loading,
      error,
      refetch,
    }),
    [data, loading, error, refetch]
  );

  return memoized;
}





