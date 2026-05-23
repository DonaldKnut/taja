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
  Package,
  ExternalLink,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Globe,
  User,
  History,
  AlertTriangle,
  CheckCircle,
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
  const activeCount = useMemo(
    () => storefronts.filter((s) => String(s.status).toLowerCase() === "active").length,
    [storefronts]
  );
  const avgProducts = useMemo(() => {
    if (!storefronts.length) return 0;
    return Math.round(
      storefronts.reduce((acc, s) => acc + Number(s.productCount || 0), 0) / storefronts.length
    );
  }, [storefronts]);

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
    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between p-1">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
            <Store className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Admin</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Storefronts</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Clean overview of sellers, storefront activity, and growth nudges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => openNudgeModal("bulk")}
            disabled={bulkNudging || lowProductCount === 0}
            className="rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <PackagePlus className="h-4 w-4 mr-2 text-emerald-500" />
            {bulkNudging ? "Sending..." : "Nudge Low-Product"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/admin/dashboard")} 
            className="rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6 border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2 text-slate-400" />
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: storefronts.length, color: "blue", icon: Store },
          { label: "Active", value: activeCount, color: "green", icon: ShieldCheck },
          { label: "Low Product", value: lowProductCount, color: "yellow", icon: PackagePlus },
          { label: "Avg Products", value: avgProducts, color: "purple", icon: Clock },
        ].map((stat, idx) => {
          const colorClasses: Record<string, string> = {
            blue: "text-blue-600 bg-blue-50 border-blue-100",
            green: "text-emerald-600 bg-emerald-50 border-emerald-100",
            yellow: "text-amber-600 bg-amber-50 border-amber-100",
            purple: "text-indigo-600 bg-indigo-50 border-indigo-100",
          };
          return (
            <Card key={idx} className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500 group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl border ${colorClasses[stat.color]} group-hover:scale-110 transition-transform shadow-sm`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 group">
          <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchStorefronts();
            }}
            placeholder="Search by storefront name, slug, owner name, or email"
            className="pl-12 rounded-2xl h-14 border-slate-200 bg-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 text-base"
          />
        </div>
        <Button onClick={fetchStorefronts} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs bg-slate-950 hover:bg-slate-900 shadow-sm text-white transition-all hover:shadow-md">
          Search
        </Button>
      </div>

      <section className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} className="rounded-[2.5rem] border-slate-100 shadow-huge">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
                      <div className="h-4 w-32 bg-slate-100 rounded-md animate-pulse" />
                    </div>
                    <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded-md animate-pulse" />
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="rounded-[2.5rem] border-slate-100 shadow-huge">
            <CardContent className="p-16 text-center">
              <Store className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-black text-slate-900 tracking-tight">No storefronts found.</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search query.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((shop) => (
            <Card key={shop._id} className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-huge transition-all duration-500 group overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate group-hover:text-emerald-600 transition-colors">{shop.shopName}</h3>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate">/{shop.shopSlug}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
                      <p className="text-sm text-slate-600 flex items-center gap-2 truncate bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                        <User className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold text-slate-900">{shop.owner?.fullName || "Unknown owner"}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 text-xs">{shop.owner?.email || "No email"}</span>
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-slate-400" />
                        Category: {shop.category || (shop.categories?.[0] ?? "—")}
                      </span>
                      <span className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm flex items-center gap-1.5">
                        <PackagePlus className="h-3.5 w-3.5 text-emerald-500" />
                        Products: {shop.productCount}
                      </span>
                      {(shop.productCount || 0) <= lowProductThreshold && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm animate-pulse">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Needs uploads
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-row gap-2 sm:flex-col sm:items-end">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${shop.status?.toLowerCase() === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'} shadow-sm`}>
                      {shop.status?.toLowerCase() === 'active' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {shop.status}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${shop.verificationStatus?.toLowerCase() === 'verified' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-amber-50 border-amber-100 text-amber-700'} shadow-sm mt-2 sm:mt-0`}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {shop.verificationStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Link
                      href={shop.links?.live || `/shop/${shop.shopSlug}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 h-11 text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 hover:shadow-md active:scale-[0.98] transition-all"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="hidden sm:inline">Live Link</span>
                      <span className="sm:hidden">Live</span>
                    </Link>
                    <Link
                      href={shop.links?.shopEdit || `/admin/shops/${shop._id}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 h-11 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 hover:shadow-md active:scale-[0.98] transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </Link>
                    <Link
                      href={shop.links?.addProduct || `/admin/products/new?shopId=${shop._id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 h-11 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 hover:shadow-md active:scale-[0.98] transition-all"
                    >
                      <PackagePlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Product</span>
                      <span className="sm:hidden">Add</span>
                    </Link>
                    <Link
                      href={shop.links?.ownerLookup || `/admin/users?search=${encodeURIComponent(shop.owner?.email || "")}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 h-11 text-[10px] font-black uppercase tracking-widest text-violet-700 hover:bg-violet-100 hover:shadow-md active:scale-[0.98] transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">View User</span>
                      <span className="sm:hidden">User</span>
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedShops((prev) => ({ ...prev, [shop._id]: !prev[shop._id] }))
                        }
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-4 border-slate-200 hover:bg-slate-50"
                      >
                        {expandedShops[shop._id] ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2 text-slate-400" />
                            Collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2 text-slate-400" />
                            Expand Details
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openHistoryDrawer(shop)}
                        className="rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-4 border-slate-200 hover:bg-slate-50"
                      >
                        <History className="h-4 w-4 mr-2 text-slate-400" />
                        Nudge History
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      disabled={nudgingShopId === shop._id}
                      onClick={() => openNudgeModal("single", shop)}
                      className="rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-6 bg-slate-950 hover:bg-emerald-600 text-white border-none shadow-sm transition-all"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {nudgingShopId === shop._id ? "Sending..." : "Send Nudge"}
                    </Button>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedShops[shop._id] ? "max-h-52 opacity-100 mt-4" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-sm text-slate-600 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">Created At</span>
                        <span className="font-semibold text-slate-900">{new Date(shop.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">All Categories</span>
                        <span className="font-semibold text-slate-900">{shop.categories?.length ? shop.categories.join(", ") : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">Owner Email</span>
                        <span className="font-semibold text-slate-900">{shop.owner?.email || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">Shop Slug</span>
                        <span className="font-semibold text-slate-900">/{shop.shopSlug}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </section>

      {nudgeModalOpen && (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeNudgeModal} />
          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="nudge-modal-title"
                className="w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] bg-white shadow-huge border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col"
              >
              <div className="p-8 border-b border-slate-50 flex items-start justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-950 flex items-center justify-center shadow-sm">
                    <Send className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                      {nudgeMode === "single" ? "Seller nudge" : "Bulk nudge"}
                    </p>
                    <h3 id="nudge-modal-title" className="text-2xl font-black text-slate-900 tracking-tight">
                      {nudgeMode === "single"
                        ? `Nudge ${nudgeTarget?.shopName || "storefront"}`
                        : "Nudge low-product storefronts"}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={closeNudgeModal}
                  className="h-10 w-10 rounded-full hover:bg-slate-200 flex items-center justify-center bg-slate-100 transition-colors"
                  aria-label="Close nudge modal"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                {nudgeMode === "single" && nudgeTarget && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current products</p>
                      <p className="text-2xl font-black text-slate-900">{nudgeTarget.productCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Owner</p>
                      <p className="font-semibold text-slate-900">{nudgeTarget.owner?.fullName || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{nudgeTarget.owner?.email || "No email"}</p>
                    </div>
                  </div>
                )}

                {nudgeMode === "bulk" && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                      Include shops with products less than or equal to
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={bulkUnderCount}
                      onChange={(e) => setBulkUnderCount(Math.max(0, Number(e.target.value || 0)))}
                      className="rounded-xl h-12 border-slate-200 bg-slate-50"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    Target products to suggest
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={nudgeMinTarget}
                    onChange={(e) => setNudgeMinTarget(Math.max(1, Number(e.target.value || 1)))}
                    className="rounded-xl h-12 border-slate-200 bg-slate-50"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                    Optional admin note
                  </label>
                  <textarea
                    value={nudgeNote}
                    onChange={(e) => setNudgeNote(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                    placeholder="Add a motivating message to include in notification/email..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-50 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
                <Button variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-slate-200 hover:bg-slate-100" onClick={closeNudgeModal}>
                  Cancel
                </Button>
                <Button
                  className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] bg-slate-950 hover:bg-emerald-600 text-white border-none shadow-sm transition-all"
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
      </div>
      )}

      {historyOpenForShop && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setHistoryOpenForShop(null)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-huge border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-50 flex items-start justify-between bg-slate-50/50">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <History className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                      Nudge timeline
                    </p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">
                      {historyOpenForShop.shopName}
                    </h3>
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100 inline-block">/{historyOpenForShop.shopSlug}</p>
              </div>
              <button
                onClick={() => setHistoryOpenForShop(null)}
                className="h-10 w-10 shrink-0 rounded-full hover:bg-slate-200 flex items-center justify-center bg-slate-100 transition-colors"
                aria-label="Close history drawer"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-50 bg-white">
              <Button
                variant="outline"
                onClick={handleResendLastNudge}
                disabled={resendingHistoryNudge || historyLoading || historyItems.length === 0}
                className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-12 border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                <Send className="h-4 w-4 mr-2 text-emerald-500" />
                {resendingHistoryNudge ? "Resending..." : "Resend last nudge"}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {historyLoading ? (
                <div className="text-center py-10 space-y-3">
                  <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading history...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-sm">
                  <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-lg font-black text-slate-900 tracking-tight">No history found</p>
                  <p className="text-sm text-slate-500 mt-1">This storefront hasn't been nudged yet.</p>
                </div>
              ) : (
                historyItems.map((item) => (
                  <div key={item._id} className="rounded-[1.5rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-base font-black text-slate-900 leading-tight">{item.title}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest rounded-lg px-2.5 py-1 bg-slate-100 text-slate-600 shrink-0">
                        {item.kind === "product-nudge-bulk" ? "bulk" : "single"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{item.message}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sent with count</p>
                        <p className="font-black text-slate-900">{item.productCountAtSend}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target</p>
                        <p className="font-black text-slate-900">{item.minTarget}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Short by</p>
                        <p className="font-black text-slate-900">{item.shortByAtSend}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${item.read ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${item.read ? 'text-emerald-600' : 'text-amber-600'}`}>Read by seller</p>
                        <p className={`font-black ${item.read ? 'text-emerald-700' : 'text-amber-700'}`}>{item.read ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                        <Globe className="h-3 w-3" />
                        {item.channel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 p-4 sm:hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white shadow-sm"
          >
            <Search className="h-4 w-4 mr-2 text-slate-400" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => openNudgeModal("bulk")}
            disabled={bulkNudging || lowProductCount === 0}
            className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white border-none shadow-sm"
          >
            <PackagePlus className="h-4 w-4 mr-2" />
            {bulkNudging ? "Sending..." : "Bulk Nudge"}
          </Button>
        </div>
      </div>
    </div>
  );
}
