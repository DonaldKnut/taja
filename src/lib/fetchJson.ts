/**
 * Lightweight JSON fetch for React Query queryFns.
 * Uses browser HTTP cache when `cache` is default (unlike api() which forces no-store).
 */
export async function fetchJson<T = unknown>(
  path: string,
  init: RequestInit & { cache?: RequestCache } = {}
): Promise<T> {
  const relativePath = path.startsWith("/api") ? path : `/api${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(relativePath, {
    ...init,
    headers,
    cache: init.cache ?? "default",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message =
      data?.message || data?.error || data?.data?.message || res.statusText || "Request failed";
    const err = new Error(message) as Error & { status?: number; data?: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}
