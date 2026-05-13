/** Compact view counts (YouTube-style): 1.2K, 3.4M */
export function formatViewCount(raw: number | undefined | null): string {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  if (n < 1000) return n.toLocaleString();
  if (n < 1_000_000) {
    const v = n / 1000;
    const s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(1);
    return `${s.replace(/\.0$/, "")}K`;
  }
  const v = n / 1_000_000;
  const s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  return `${s.replace(/\.00$/, "").replace(/\.0$/, "")}M`;
}
