"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OverviewHeader } from "../_components/OverviewHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function AdminOverviewStoreReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    summary: { pending: number };
    shops: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ page: String(page), limit: "20" });
        const res = await api(`/api/admin/overview/store-reviews?${q}`);
        if (cancelled) return;
        if (res?.success) setData(res.data);
        else toast.error(res?.message || "Failed to load shops");
      } catch {
        if (!cancelled) toast.error("Failed to load shops");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <OverviewHeader
        title="Store reviews"
        subtitle="Shops with status pending, waiting for admin approval."
      />

      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <p className="text-sm font-black text-slate-600">
          Pending: <span className="text-slate-900">{(data?.summary.pending ?? 0).toLocaleString()}</span>
        </p>
        <Link href="/admin/storefronts">
          <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-5">
            Storefronts
          </Button>
        </Link>
      </div>

      <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="p-12 text-center text-slate-500 font-bold">Loading…</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-3">Shop</th>
                      <th className="px-6 py-3">Owner</th>
                      <th className="px-6 py-3">Applied</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.shops ?? []).map((s: any) => (
                      <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-900">{s.shopName}</p>
                          <p className="text-xs font-bold text-slate-400">{s.shopSlug}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">{s.owner?.fullName ?? "—"}</p>
                          <p className="text-xs font-bold text-slate-400">{s.owner?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {s.createdAt ? formatDate(s.createdAt) : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/shops/${s._id}/edit`}>
                            <Button size="sm" variant="outline" className="rounded-xl font-black uppercase text-[10px]">
                              Review
                            </Button>
                          </Link>
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
