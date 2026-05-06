"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { OverviewHeader } from "../_components/OverviewHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function AdminOverviewInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    summary: { totalProducts: number };
    products: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ page: String(page), limit: "20" });
        if (appliedSearch) q.set("search", appliedSearch);
        const res = await api(`/api/admin/overview/inventory?${q}`);
        if (cancelled) return;
        if (res?.success) setData(res.data);
        else toast.error(res?.message || "Failed to load inventory");
      } catch {
        if (!cancelled) toast.error("Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, appliedSearch]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <OverviewHeader
        title="Inventory"
        subtitle="All catalogue products (excluding deleted). Open a product in admin to edit."
      />

      <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-white"
            placeholder="Search title or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-6">
          Search
        </Button>
        <Link href="/admin/products">
          <Button type="button" variant="outline" className="w-full sm:w-auto rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-6">
            Full products admin
          </Button>
        </Link>
      </form>

      <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="p-12 text-center text-slate-500 font-bold">Loading…</div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Total products
                </span>
                <span className="text-xl font-black text-slate-900">
                  {(data?.summary.totalProducts ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Shop</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Stock</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.products ?? []).map((p: any) => (
                      <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            {p.images?.[0] ? (
                              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-slate-100 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 truncate">{p.title}</p>
                              <p className="text-xs font-bold text-slate-400 truncate">{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-600">
                          {p.shop?.shopName ?? "—"}
                        </td>
                        <td className="px-6 py-4 font-black">{formatCurrency(p.price || 0)}</td>
                        <td className="px-6 py-4 font-bold">{p.inventory ?? 0}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data && data.pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-xl"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-xl"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
