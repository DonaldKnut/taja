"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, productsApi } from "@/lib/api";
import type { Product, Shop } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface MarketplaceFeedOptions {
  category?: string;
  limit?: number;
  search?: string;
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

const fallbackProducts: Product[] = [
  {
    _id: "fallback-1",
    slug: "vintage-denim-jacket",
    title: "Vintage Denim Jacket",
    description: "Classic Lagos thrift find with authentic distressing.",
    price: 15000,
    compareAtPrice: 25000,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800",
    ],
    category: "Fashion",
    condition: "like-new",
    stock: 4,
    seller: "amina-thrift",
    shop: {
      _id: "shop-1",
      shopName: "Amina Thrift",
      shopSlug: "amina-thrift",
      owner: "amina",
      isVerified: true,
      averageRating: 4.8,
    },
    shopSlug: "amina-thrift",
    location: "Lagos",
    averageRating: 4.8,
    reviewCount: 126,
  },
  {
    _id: "fallback-2",
    slug: "handmade-ankara-bag",
    title: "Handmade Ankara Bag",
    description: "Handcrafted statement piece sourced from Abuja artisans.",
    price: 8000,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800",
    ],
    category: "Accessories",
    condition: "new",
    stock: 10,
    seller: "kemi-crafts",
    shop: {
      _id: "shop-2",
      shopName: "Kemi Crafts",
      shopSlug: "kemi-crafts",
      owner: "kemi",
      isVerified: true,
      averageRating: 4.9,
    },
    shopSlug: "kemi-crafts",
    location: "Abuja",
    averageRating: 4.9,
    reviewCount: 86,
  },
  {
    _id: "fallback-3",
    slug: "designer-sneakers",
    title: "Designer Sneakers",
    description: "Premium kicks with authentic packaging and warranty.",
    price: 45000,
    compareAtPrice: 80000,
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800",
    ],
    category: "Fashion",
    condition: "good",
    stock: 6,
    seller: "sneakerhub",
    shop: {
      _id: "shop-3",
      shopName: "SneakerHub",
      shopSlug: "sneakerhub",
      owner: "tayo",
      isVerified: false,
      averageRating: 4.2,
    },
    shopSlug: "sneakerhub",
    location: "Lagos",
    averageRating: 4.2,
    reviewCount: 64,
  },
];

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
  const { category, limit, search } = options;
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<MarketplaceFeedResponse>({
    products: [], // Start with empty array, show fallback only while loading
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
        // If search query is provided, use productsApi.search instead
        if (options?.search) {
          const response = await productsApi.search(options.search, undefined, options.limit);
          
          const searchResults = response?.data?.products || response?.products || response?.data || [];
          
          setData({
            products: searchResults,
            recommendedShops: [],
            categories: fallbackCategories,
            savedFilters: [],
            personalizedHeadline: undefined,
            experimentVariant: "control",
          });
          return;
        }

        // Otherwise use the marketplace feed endpoint
        const params = new URLSearchParams();
        if (category) params.append("category", category);
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
    [category, limit, options?.search, isAuthenticated, user?._id]
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





