"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, Plus, Loader2, Trash2, Pause, Play, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface ShopRow {
  _id: string;
  shopName: string;
  shopSlug: string;
  status: string;
  owner?: { fullName?: string; email?: string };
}

export default function AdminShopsPage() {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const fetchShops = async () => {
    try {
      const res = await api("/api/admin/shops");
      if (res?.success && Array.isArray(res.data)) setShops(res.data);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`Ban and remove "${shopName}"? Its products will be suspended and the shop will no longer appear.`)) return;
    try {
      setActing(shopId);
      const res = await api(`/api/admin/shops/${shopId}`, { method: "DELETE" });
      if (res?.success) {
        toast.success("Shop banned and products suspended");
        await fetchShops();
      } else {
        toast.error(res?.message || "Failed to ban shop");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to ban shop");
    } finally {
      setActing(null);
    }
  };

  const handleShopStatus = async (shopId: string, action: "suspend" | "activate") => {
    try {
      setActing(shopId);
      const res = await api(`/api/admin/shops/${shopId}`, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      if (res?.success) {
        toast.success(action === "suspend" ? "Shop suspended" : "Shop activated");
        await fetchShops();
      } else {
        toast.error(res?.message || "Failed to update shop");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to update shop");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-sm flex items-center justify-center">
            <Store className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Marketplace</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Shops</h1>
          </div>
        </div>
        <Link href="/admin/shops/new">
          <Button className="h-12 px-6 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create shop
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30">
          <CardTitle className="text-slate-900 font-black tracking-tight">All shops</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : shops.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-bold">No shops yet</p>
              <p className="text-sm mt-1">Create a shop to add products and help onboard store owners.</p>
              <Link href="/admin/shops/new" className="inline-block mt-4">
                <Button className="rounded-xl">Create shop</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {shops.map((shop) => (
                <div
                  key={shop._id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <p className="font-black text-slate-900 tracking-tight">{shop.shopName}</p>
                    <p className="text-xs text-slate-500 font-mono">{shop.shopSlug}</p>
                    {shop.owner && (
                      <p className="text-xs text-slate-400 mt-1">
                        Owner: {shop.owner.fullName || "—"} {shop.owner.email ? `(${shop.owner.email})` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${shop.status === "active" ? "bg-emerald-400/10 text-emerald-600" : shop.status === "banned" ? "bg-rose-400/10 text-rose-600" : "bg-amber-400/10 text-amber-600"}`}>
                      {shop.status}
                    </span>
                    <Link href={`/admin/shops/${shop._id}/edit`}>
                      <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    {shop.status !== "banned" && (
                      <>
                        <Link href={`/admin/products/new?shopId=${shop._id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold">
                            Add product
                          </Button>
                        </Link>
                        {shop.status === "active" ? (
                          <button
                            onClick={() => handleShopStatus(shop._id, "suspend")}
                            disabled={acting === shop._id}
                            className="h-9 px-3 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[10px] uppercase flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Pause className="h-3.5 w-3.5" /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleShopStatus(shop._id, "activate")}
                            disabled={acting === shop._id}
                            className="h-9 px-3 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-[10px] uppercase flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Play className="h-3.5 w-3.5" /> Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteShop(shop._id, shop.shopName)}
                          disabled={acting === shop._id}
                          className="h-9 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase flex items-center gap-1.5 disabled:opacity-50"
                          title="Ban shop and suspend its products"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
