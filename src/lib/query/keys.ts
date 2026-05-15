export const queryKeys = {
  marketplaceFeed: (filters: Record<string, unknown>) =>
    ["marketplace", "feed", filters] as const,
  homepageRecommendations: () => ["homepage", "recommendations"] as const,
  products: {
    list: (params: Record<string, unknown>) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
};
