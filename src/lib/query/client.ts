import { QueryClient } from "react-query";

/** Aggressive in-memory cache — marketplace & catalog data stay warm across navigations. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        retry: 1,
        keepPreviousData: true,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  if (!browserClient) {
    browserClient = createQueryClient();
  }
  return browserClient;
}
