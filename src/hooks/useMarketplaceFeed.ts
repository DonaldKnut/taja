"use client";

import { useMemo } from "react";
import { useQuery } from "react-query";
import { fetchJson } from "@/lib/fetchJson";
import { queryKeys } from "@/lib/query/keys";
import { prefetchFeedProductThumbnails } from "@/lib/media/prefetch";
import type { Product, Shop } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface MarketplaceFeedOptions {
  category?: string;
  limit?: number;
  search?: string;
  shop?: string;
  seller?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
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

const EMPTY_FEED: MarketplaceFeedResponse = {
  products: [],
  categories: fallbackCategories,
  recommendedShops: [],
  savedFilters: [],
  experimentVariant: "control",
};

function parseFeedResponse(response: unknown): MarketplaceFeedResponse {
  const res = response as Record<string, unknown>;
  let payload: MarketplaceFeedResponse;

  if (res?.success && res?.data) {
    payload = res.data as MarketplaceFeedResponse;
  } else if (res?.products) {
    payload = res as MarketplaceFeedResponse;
  } else if ((res?.data as MarketplaceFeedResponse)?.products) {
    payload = res.data as MarketplaceFeedResponse;
  } else {
    payload = res as MarketplaceFeedResponse;
  }

  return {
    products: payload?.products ?? [],
    recommendedShops: payload?.recommendedShops ?? [],
    categories: payload?.categories ?? fallbackCategories,
    savedFilters: payload?.savedFilters ?? [],
    personalizedHeadline: payload?.personalizedHeadline,
    experimentVariant: payload?.experimentVariant ?? "control",
  };
}

export function useMarketplaceFeed(options: MarketplaceFeedOptions = {}) {
  const { category, limit, search, shop, seller, location, minPrice, maxPrice, verifiedOnly } =
    options;
  const { user, isAuthenticated } = useAuth();

  const filterKey = useMemo(
    () => ({
      category: category ?? "",
      limit: limit ?? 50,
      search: search ?? "",
      shop: shop ?? "",
      seller: seller ?? "",
      location: location ?? "",
      minPrice:
        typeof minPrice === "number" && !Number.isNaN(minPrice) ? minPrice : ("" as const),
      maxPrice:
        typeof maxPrice === "number" && !Number.isNaN(maxPrice) ? maxPrice : ("" as const),
      verifiedOnly: Boolean(verifiedOnly),
      userId: isAuthenticated && user?._id ? user._id : "",
      includeMine: isAuthenticated && (user as { role?: string })?.role === "seller",
    }),
    [
      category,
      limit,
      search,
      shop,
      seller,
      location,
      minPrice,
      maxPrice,
      verifiedOnly,
      isAuthenticated,
      user?._id,
      user,
    ]
  );

  const query = useQuery(
    queryKeys.marketplaceFeed(filterKey),
    async ({ signal }) => {
      const params = new URLSearchParams();
      if (filterKey.category) params.append("category", filterKey.category);
      if (filterKey.search) params.append("search", filterKey.search);
      if (filterKey.shop) params.append("shop", filterKey.shop);
      if (filterKey.seller) params.append("seller", filterKey.seller);
      if (filterKey.location) params.append("location", filterKey.location);
      if (typeof filterKey.minPrice === "number" && !Number.isNaN(filterKey.minPrice)) {
        params.append("minPrice", `${filterKey.minPrice}`);
      }
      if (typeof filterKey.maxPrice === "number" && !Number.isNaN(filterKey.maxPrice)) {
        params.append("maxPrice", `${filterKey.maxPrice}`);
      }
      if (filterKey.verifiedOnly) params.append("verifiedOnly", "true");
      params.append("limit", `${filterKey.limit}`);
      if (filterKey.userId) params.append("userId", filterKey.userId);
      if (filterKey.includeMine) params.append("includeMine", "true");

      const response = await fetchJson(`/api/marketplace/feed?${params.toString()}`, {
        signal,
        cache: "default",
      });
      return parseFeedResponse(response);
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      keepPreviousData: true,
      onSuccess: (data) => {
        prefetchFeedProductThumbnails(data.products, 20);
      },
    }
  );

  const data = query.data ?? EMPTY_FEED;

  return {
    ...data,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}
