"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OverviewHeader } from "../_components/OverviewHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "react-hot-toast";

export default function AdminOverviewRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    summary: { totalRevenue: number; orderCount: number };
    recentOrders: any[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api("/api/admin/overview/revenue?limit=25");
        if (cancelled) return;
        if (res?.success) setData(res.data);
        else toast.error(res?.message || "Failed to load revenue");
      } catch {
        if (!cancelled) toast.error("Failed to load revenue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = data?.summary;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <OverviewHeader
        title="Total revenue"
        subtitle="Sum of order totals for delivered and completed orders. For charts and funnels, use analytics."
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card className="rounded-[2rem] border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lifetime revenue</p>
            <p className="text-3xl font-black text-slate-900">
              {loading && !data ? "—" : formatCurrency(summary?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Delivered / completed orders</p>
            <p className="text-3xl font-black text-slate-900">
              {loading && !data ? "—" : (summary?.orderCount ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        <Link href="/admin/analytics">
          <Button variant="outline" className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-5">
            Open analytics
          </Button>
        </Link>
      </div>

      <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-900">Recent paid-through orders</h2>
          </div>
          {loading && !data ? (
            <div className="p-12 text-center text-slate-500 font-bold">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Shop</th>
                    <th className="px-6 py-3">Buyer</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders ?? []).map((o: any) => (
                    <tr key={o._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-black text-slate-900">{o.orderNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-600">{o.shop?.shopName ?? "—"}</td>
                      <td className="px-6 py-4 font-bold text-slate-600">{o.buyer?.fullName ?? "—"}</td>
                      <td className="px-6 py-4 font-black">{formatCurrency(o.totals?.total ?? 0)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {o.createdAt ? formatDate(o.createdAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
