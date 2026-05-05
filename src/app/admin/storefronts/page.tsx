"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Search, ArrowLeft, ShieldCheck, Clock, PackagePlus } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "react-hot-toast";

type Storefront = {
  _id: string;
  shopName: string;
  shopSlug: string;
  status: string;
  verificationStatus: string;
  category: string | null;
  categories: string[];
  createdAt: string;
  productCount: number;
  owner: { _id: string; fullName: string; email: string } | null;
};

export default function AdminStorefrontsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nudgingShopId, setNudgingShopId] = useState<string | null>(null);
  const [bulkNudging, setBulkNudging] = useState(false);
  const [query, setQuery] = useState("");
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const lowProductThreshold = 5;

  const fetchStorefronts = async () => {
    try {
      setLoading(true);
      const suffix = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
      const res = await api(`/api/admin/shops/storefronts${suffix}`);
      if (res?.success && Array.isArray(res?.data)) {
        setStorefronts(res.data);
      } else {
        toast.error(res?.message || "Failed to load storefronts");
      }
    } catch {
      toast.error("Failed to load storefronts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefronts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNudgeSeller = async (shop: Storefront) => {
    const minTarget = 10;
    const note = window.prompt(
      `Optional note to seller for "${shop.shopName}" (current: ${shop.productCount} products).\nLeave blank for default message.`,
      ""
    );
    try {
      setNudgingShopId(shop._id);
      const res = await api(`/api/admin/shops/storefronts/${shop._id}/nudge`, {
        method: "POST",
        body: JSON.stringify({ minTarget, note: note || undefined }),
      });
      if (res?.success) {
        const sentMailText = res?.data?.emailSent ? " + email" : "";
        toast.success(`Nudge sent (in-app${sentMailText})`);
      } else {
        toast.error(res?.message || "Failed to send seller nudge");
      }
    } catch {
      toast.error("Failed to send seller nudge");
    } finally {
      setNudgingShopId(null);
    }
  };

  const filtered = useMemo(() => storefronts, [storefronts]);
  const lowProductCount = useMemo(
    () => storefronts.filter((s) => (s.productCount || 0) <= lowProductThreshold).length,
    [storefronts]
  );

  const handleBulkNudge = async () => {
    const note = window.prompt(
      `Optional note for low-product sellers (${lowProductThreshold} products or less):`,
      ""
    );
    try {
      setBulkNudging(true);
      const res = await api("/api/admin/shops/storefronts/nudge-bulk", {
        method: "POST",
        body: JSON.stringify({
          underCount: lowProductThreshold,
          minTarget: 10,
          note: note || undefined,
          limit: 200,
        }),
      });
      if (res?.success) {
        toast.success(
          `Bulk nudge done: ${res?.data?.nudged || 0} in-app, ${res?.data?.emailed || 0} emails`
        );
      } else {
        toast.error(res?.message || "Bulk nudge failed");
      }
    } catch {
      toast.error("Bulk nudge failed");
    } finally {
      setBulkNudging(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-950 flex items-center justify-center">
            <Store className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Admin</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Storefronts</h1>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/dashboard")} className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="rounded-[2rem] border-slate-100 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-black text-slate-900 flex items-center justify-between gap-3">
            <span>Find Storefronts</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                Low products: {lowProductCount}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkNudge}
                disabled={bulkNudging || lowProductCount === 0}
                className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8"
              >
                <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
                {bulkNudging ? "Sending..." : "Nudge all low-product"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or slug"
              className="pl-9 rounded-xl"
            />
          </div>
          <Button onClick={fetchStorefronts} className="rounded-xl">Search</Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-slate-500 p-8">Loading storefronts...</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-[2rem] border-slate-100">
          <CardContent className="p-10 text-center text-slate-500">No storefronts found.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((shop) => (
            <Card key={shop._id} className="rounded-[1.5rem] border-slate-100 hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-900 truncate">{shop.shopName}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1">/{shop.shopSlug}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Owner: <span className="font-semibold text-slate-700">{shop.owner?.fullName || "Unknown"}</span>
                    </p>
                    <p className="text-xs text-slate-500">{shop.owner?.email || "No email"}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Category: {shop.category || (shop.categories?.[0] ?? "—")}
                    </p>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>Products: <span className="font-black text-slate-700">{shop.productCount}</span></span>
                      {(shop.productCount || 0) <= lowProductThreshold && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest">
                          Needs uploads
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 space-y-2 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-100 text-slate-700">
                      <Clock className="h-3 w-3" />
                      {shop.status}
                    </span>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded bg-emerald-50 text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        {shop.verificationStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/shop/${shop.shopSlug}`} className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700">
                      Open storefront
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={nudgingShopId === shop._id}
                      onClick={() => handleNudgeSeller(shop)}
                      className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8"
                    >
                      <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
                      {nudgingShopId === shop._id ? "Sending..." : "Nudge seller"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
