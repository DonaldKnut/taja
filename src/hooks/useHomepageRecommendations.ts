"use client";

import { useQuery } from "react-query";
import { fetchJson } from "@/lib/fetchJson";
import { queryKeys } from "@/lib/query/keys";
import { prefetchFeedProductThumbnails } from "@/lib/media/prefetch";

export interface HomepageProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  maxPrice?: number;
  variants?: Array<{ price?: number; active?: boolean }>;
  images: string[];
  rating?: number;
  soldCount?: number;
  shop?: { shopName: string; shopSlug: string };
}

export interface RecommendationGroup {
  type: string;
  title: string;
  iconKey: "sparkles" | "trending" | "package";
  products: HomepageProduct[];
}

type HomepageApiPayload = {
  data?: {
    personalized?: Array<{ product?: HomepageProduct }>;
    trending?: Array<{ product?: HomepageProduct }>;
    newArrivals?: Array<{ product?: HomepageProduct }>;
  };
};

function parseGroups(response: HomepageApiPayload): RecommendationGroup[] {
  const groups: RecommendationGroup[] = [];
  const data = response?.data;
  if (!data) return groups;

  if (data.personalized?.length) {
    groups.push({
      type: "personalized",
      title: "Recommended For You",
      iconKey: "sparkles",
      products: data.personalized.map((r) => r.product).filter(Boolean) as HomepageProduct[],
    });
  }
  if (data.trending?.length) {
    groups.push({
      type: "trending",
      title: "Trending Now",
      iconKey: "trending",
      products: data.trending.map((r) => r.product).filter(Boolean) as HomepageProduct[],
    });
  }
  if (data.newArrivals?.length) {
    groups.push({
      type: "new",
      title: "New Arrivals",
      iconKey: "package",
      products: data.newArrivals.map((r) => r.product).filter(Boolean) as HomepageProduct[],
    });
  }
  return groups;
}

export function useHomepageRecommendations() {
  const query = useQuery(
    queryKeys.homepageRecommendations(),
    () => fetchJson<HomepageApiPayload>("/api/ai/recommendations/homepage"),
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 60 * 60 * 1000,
      onSuccess: (response) => {
        const groups = parseGroups(response);
        const products = groups.flatMap((g) => g.products);
        prefetchFeedProductThumbnails(products, 12);
      },
    }
  );

  return {
    groups: query.data ? parseGroups(query.data) : [],
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
