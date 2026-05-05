"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Search,
  ArrowLeft,
  ShieldCheck,
  Clock,
  PackagePlus,
  ExternalLink,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Globe,
  User,
  History,
} from "lucide-react";
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
  links?: {
    live: string;
    shopEdit: string;
    addProduct: string;
    ownerLookup: string;
  };
};

type NudgeMode = "single" | "bulk";
type NudgeHistoryItem = {
  _id: string;
  title: string;
  message: string;
  kind: string;
  minTarget: number;
  productCountAtSend: number;
  shortByAtSend: number;
  read: boolean;
  createdAt: string;
  channel: string;
};

export default function AdminStorefrontsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nudgingShopId, setNudgingShopId] = useState<string | null>(null);
  const [bulkNudging, setBulkNudging] = useState(false);
  const [query, setQuery] = useState("");
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({});
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [nudgeMode, setNudgeMode] = useState<NudgeMode>("single");
  const [nudgeTarget, setNudgeTarget] = useState<Storefront | null>(null);
  const [nudgeNote, setNudgeNote] = useState("");
  const [nudgeMinTarget, setNudgeMinTarget] = useState(10);
  const [bulkUnderCount, setBulkUnderCount] = useState(5);
  const [historyOpenForShop, setHistoryOpenForShop] = useState<Storefront | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<NudgeHistoryItem[]>([]);
  const [resendingHistoryNudge, setResendingHistoryNudge] = useState(false);
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

  const openNudgeModal = (mode: NudgeMode, shop?: Storefront) => {
    setNudgeMode(mode);
    setNudgeTarget(shop || null);
    setNudgeNote("");
    setNudgeMinTarget(10);
    setBulkUnderCount(lowProductThreshold);
    setNudgeModalOpen(true);
  };

  const closeNudgeModal = () => {
    setNudgeModalOpen(false);
    setNudgeTarget(null);
    setNudgeNote("");
  };

  const handleNudgeSeller = async (shop: Storefront, minTarget: number, note: string) => {
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

  const handleBulkNudge = async (underCount: number, minTarget: number, note: string) => {
    try {
      setBulkNudging(true);
      const res = await api("/api/admin/shops/storefronts/nudge-bulk", {
        method: "POST",
        body: JSON.stringify({
          underCount,
          minTarget,
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

  const submitNudgeModal = async () => {
    if (nudgeMode === "single") {
      if (!nudgeTarget) return;
      await handleNudgeSeller(nudgeTarget, nudgeMinTarget, nudgeNote.trim());
      closeNudgeModal();
      return;
    }
    await handleBulkNudge(bulkUnderCount, nudgeMinTarget, nudgeNote.trim());
    closeNudgeModal();
  };

  const openHistoryDrawer = async (shop: Storefront) => {
    setHistoryOpenForShop(shop);
    setHistoryLoading(true);
    setHistoryItems([]);
    try {
      const res = await api(
        `/api/admin/shops/storefronts/${shop._id}/nudge-history?limit=15`
      );
      if (res?.success) {
        setHistoryItems(Array.isArray(res?.data?.history) ? res.data.history : []);
      } else {
        toast.error(res?.message || "Failed to load nudge history");
      }
    } catch {
      toast.error("Failed to load nudge history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleResendLastNudge = async () => {
    if (!historyOpenForShop) return;
    try {
      setResendingHistoryNudge(true);
      const res = await api(
        `/api/admin/shops/storefronts/${historyOpenForShop._id}/nudge/resend-last`,
        { method: "POST" }
      );
      if (res?.success) {
        toast.success(
          `Follow-up sent${res?.data?.emailSent ? " + email" : ""}`
        );
        await openHistoryDrawer(historyOpenForShop);
      } else {
        toast.error(res?.message || "Failed to resend last nudge");
      }
    } catch {
      toast.error("Failed to resend last nudge");
    } finally {
      setResendingHistoryNudge(false);
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
                onClick={() => openNudgeModal("bulk")}
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
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-semibold text-slate-700">{shop.owner?.fullName || "Unknown owner"}</span>
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
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Link
                      href={shop.links?.live || `/shop/${shop.shopSlug}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 h-9 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Live Link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={shop.links?.shopEdit || `/admin/shops/${shop._id}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 h-9 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profile
                    </Link>
                    <Link
                      href={shop.links?.addProduct || `/admin/products/new?shopId=${shop._id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 h-9 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 transition-all"
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      Add Product
                    </Link>
                    <Link
                      href={shop.links?.ownerLookup || `/admin/users?search=${encodeURIComponent(shop.owner?.email || "")}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 h-9 text-[10px] font-black uppercase tracking-widest text-violet-700 hover:bg-violet-100 transition-all"
                    >
                      <User className="h-3.5 w-3.5" />
                      View User
                    </Link>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedShops((prev) => ({ ...prev, [shop._id]: !prev[shop._id] }))
                        }
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8"
                      >
                        {expandedShops[shop._id] ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                            Expand
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistoryDrawer(shop)}
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8"
                      >
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        Nudge history
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={nudgingShopId === shop._id}
                      onClick={() => openNudgeModal("single", shop)}
                      className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8"
                    >
                      <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
                      {nudgingShopId === shop._id ? "Sending..." : "Nudge seller"}
                    </Button>
                  </div>

                  {expandedShops[shop._id] && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                      <p>
                        <span className="font-bold text-slate-800">Created:</span>{" "}
                        {new Date(shop.createdAt).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-bold text-slate-800">All categories:</span>{" "}
                        {shop.categories?.length ? shop.categories.join(", ") : "—"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-800">Owner email:</span>{" "}
                        {shop.owner?.email || "—"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-800">Shop slug:</span> /{shop.shopSlug}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {nudgeModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeNudgeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    {nudgeMode === "single" ? "Seller nudge" : "Bulk nudge"}
                  </p>
                  <h3 className="text-xl font-black text-slate-900">
                    {nudgeMode === "single"
                      ? `Nudge ${nudgeTarget?.shopName || "storefront"}`
                      : "Nudge low-product storefronts"}
                  </h3>
                </div>
                <button
                  onClick={closeNudgeModal}
                  className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Close nudge modal"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {nudgeMode === "single" && nudgeTarget && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700">
                    <p>
                      Current products:{" "}
                      <span className="font-black text-slate-900">{nudgeTarget.productCount}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Owner: {nudgeTarget.owner?.fullName || "Unknown"} ({nudgeTarget.owner?.email || "No email"})
                    </p>
                  </div>
                )}

                {nudgeMode === "bulk" && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Include shops with products less than or equal to
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={bulkUnderCount}
                      onChange={(e) => setBulkUnderCount(Math.max(0, Number(e.target.value || 0)))}
                      className="mt-2 rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Target products to suggest
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={nudgeMinTarget}
                    onChange={(e) => setNudgeMinTarget(Math.max(1, Number(e.target.value || 1)))}
                    className="mt-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Optional admin note
                  </label>
                  <textarea
                    value={nudgeNote}
                    onChange={(e) => setNudgeNote(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Add a motivating message to include in notification/email..."
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="outline" className="rounded-xl" onClick={closeNudgeModal}>
                  Cancel
                </Button>
                <Button
                  className="rounded-xl"
                  disabled={bulkNudging || (nudgeMode === "single" && nudgingShopId === nudgeTarget?._id)}
                  onClick={submitNudgeModal}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {nudgeMode === "single" ? "Send nudge" : "Run bulk nudge"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyOpenForShop && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setHistoryOpenForShop(null)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                  Storefront nudge timeline
                </p>
                <h3 className="text-xl font-black text-slate-900">
                  {historyOpenForShop.shopName}
                </h3>
                <p className="text-xs text-slate-500">/{historyOpenForShop.shopSlug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendLastNudge}
                  disabled={resendingHistoryNudge || historyLoading || historyItems.length === 0}
                  className="rounded-xl text-[10px] font-black uppercase tracking-widest h-8"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {resendingHistoryNudge ? "Resending..." : "Resend last"}
                </Button>
                <button
                  onClick={() => setHistoryOpenForShop(null)}
                  className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Close history drawer"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {historyLoading ? (
                <div className="text-sm text-slate-500">Loading history...</div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                  No nudge history yet for this storefront.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div key={item._id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-900">{item.title}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-1 bg-slate-100 text-slate-600">
                        {item.kind === "product-nudge-bulk" ? "bulk" : "single"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.message}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <p className="text-slate-500">
                        Sent with count:{" "}
                        <span className="font-bold text-slate-800">{item.productCountAtSend}</span>
                      </p>
                      <p className="text-slate-500">
                        Target:{" "}
                        <span className="font-bold text-slate-800">{item.minTarget}</span>
                      </p>
                      <p className="text-slate-500">
                        Short by:{" "}
                        <span className="font-bold text-slate-800">{item.shortByAtSend}</span>
                      </p>
                      <p className="text-slate-500">
                        Read by seller:{" "}
                        <span className="font-bold text-slate-800">{item.read ? "Yes" : "No"}</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {new Date(item.createdAt).toLocaleString()} • channel: {item.channel}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
