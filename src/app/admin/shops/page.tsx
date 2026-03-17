"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Store, Plus, Loader2, Trash2, Pause, Play, Pencil, ExternalLink, MessageSquare, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { api, getAuthToken } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface ShopRow {
  _id: string;
  shopName: string;
  shopSlug: string;
  status: string;
  owner?: { _id: string; fullName?: string; email?: string };
}

export default function AdminShopsPage() {
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [messagingShop, setMessagingShop] = useState<ShopRow | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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

  const handleSendMessage = async () => {
    if (!messagingShop || !messageText.trim()) return;
    try {
      setSendingMessage(true);
      const res = await api("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          userId: messagingShop.owner?._id,
          title: "Admin Message",
          message: messageText.trim(),
          type: "system",
          priority: "normal",
        }),
      });
      if (res?.success) {
        toast.success("Message sent to shop owner");
        setMessagingShop(null);
        setMessageText("");
      } else {
        toast.error(res?.message || "Failed to send message");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("/api/admin/shops/export", {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        toast.error("Failed to export shops");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shops-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "Failed to export shops");
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-12 px-5 rounded-2xl border border-slate-200 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link href="/admin/shops/new">
            <Button className="h-12 px-6 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create shop
            </Button>
          </Link>
        </div>
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
                  <div className="min-w-0 pr-4">
                    <p className="font-black text-slate-900 tracking-tight truncate">{shop.shopName}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{shop.shopSlug}</p>
                    {shop.owner && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        Owner: {shop.owner.fullName || "—"} {shop.owner.email ? `(${shop.owner.email})` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${shop.status === "active" ? "bg-emerald-400/10 text-emerald-600" : shop.status === "banned" ? "bg-rose-400/10 text-rose-600" : "bg-amber-400/10 text-amber-600"}`}>
                      {shop.status}
                    </span>

                    <Link href={`/shop/${shop.shopSlug}`} target="_blank">
                      <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold gap-1.5 border-slate-200">
                        <ExternalLink className="h-3.5 w-3.5" /> View live
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/shop/${shop.shopSlug}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Shop link copied to clipboard");
                      }}
                      className="rounded-xl text-[10px] font-bold gap-1.5 border-slate-200"
                    >
                      <Store className="h-3.5 w-3.5" /> Copy Link
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessagingShop(shop)}
                      className="rounded-xl text-[10px] font-bold gap-1.5 border-slate-200"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message
                    </Button>

                    <Link href={`/admin/shops/${shop._id}/edit`}>
                      <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold gap-1.5 border-slate-200">
                        <Pencil className="h-3.5 w-3.5" /> Edit Profile
                      </Button>
                    </Link>

                    {shop.status !== "banned" && (
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/new?shopId=${shop._id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold border-slate-200 px-3">
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
                          className="h-9 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          title="Ban shop and suspend its products"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Modal */}
      {messagingShop && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-huge border border-slate-100 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Direct Outreach</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Message {messagingShop.shopName}</h3>
              </div>
              <button onClick={() => setMessagingShop(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <Plus className="h-5 w-5 rotate-45 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Concierge Message</label>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="How can we help your shop grow today? Type your message here..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-0 focus:border-emerald-500 font-bold text-slate-700 text-sm"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageText.trim()}
                className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-huge transition-all"
              >
                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to Owner
              </Button>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                The owner will receive this instantly in their dashboard notifications.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
