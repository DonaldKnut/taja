"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  BadgeCheck,
  Ban,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface KYCSubmission {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  businessName?: string;
  businessType?: string;
  businessRegistrationNumber?: string;
  idType: string;
  idNumber: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankVerificationNumber?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  rejectionReason?: string;
}

interface PendingShop {
  _id: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  owner: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  } | null;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending Check",
    icon: Clock,
    pill: "bg-amber-400/10 text-amber-600 border border-amber-400/20",
    iconColor: "text-amber-500",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    pill: "bg-emerald-400/10 text-emerald-600 border border-emerald-400/20",
    iconColor: "text-emerald-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    pill: "bg-rose-400/10 text-rose-600 border border-rose-400/20",
    iconColor: "text-rose-600",
  },
};

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopActionLoading, setShopActionLoading] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await api("/api/admin/kyc");
      if (data?.kyc) setSubmissions(data.kyc);
    } catch { toast.error("Failed to load submissions"); }
    finally { setLoading(false); }
  };

  const fetchShops = async () => {
    setShopsLoading(true);
    try {
      const res = await api("/api/admin/shops/pending");
      if (res?.success && Array.isArray(res.data)) {
        setShops(res.data);
      }
    } catch {
      toast.error("Failed to load shops awaiting verification");
    } finally {
      setShopsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchShops();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await api(`/api/admin/kyc/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ action: "approve" }),
      });
      if (res?.success) {
        toast.success("KYC approved!");
        setSubmissions((prev) => prev.map((s) => s.userId._id === userId ? { ...s, status: "approved" } : s));
        setExpandedId(null);
      } else { toast.error(res?.message || "Failed to approve"); }
    } catch { toast.error("Error approving submission"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectReason[userId]?.trim();
    if (!reason) { toast.error("Please provide a rejection reason"); return; }
    setActionLoading(userId);
    try {
      const res = await api(`/api/admin/kyc/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ action: "reject", rejectionReason: reason }),
      });
      if (res?.success) {
        toast.success("KYC rejected.");
        setSubmissions((prev) => prev.map((s) => s.userId._id === userId ? { ...s, status: "rejected", rejectionReason: reason } : s));
        setExpandedId(null);
      } else { toast.error(res?.message || "Failed to reject"); }
    } catch { toast.error("Error rejecting submission"); }
    finally { setActionLoading(null); }
  };

  const filtered = submissions.filter((s) => filter === "all" || s.status === filter);

  const stats = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  const handleShopApprove = async (shopId: string) => {
    setShopActionLoading(shopId);
    try {
      const res = await api(`/api/admin/shops/${shopId}/review`, {
        method: "PUT",
        body: JSON.stringify({ action: "approve" }),
      });
      if (res?.success) {
        toast.success("Shop verified and activated");
        setShops((prev) => prev.filter((s) => s._id !== shopId));
      } else {
        toast.error(res?.message || "Failed to approve shop");
      }
    } catch {
      toast.error("Error approving shop");
    } finally {
      setShopActionLoading(null);
    }
  };

  const handleShopReject = async (shopId: string) => {
    setShopActionLoading(shopId);
    try {
      const res = await api(`/api/admin/shops/${shopId}/review`, {
        method: "PUT",
        body: JSON.stringify({ action: "reject" }),
      });
      if (res?.success) {
        toast.success("Shop verification rejected");
        setShops((prev) => prev.filter((s) => s._id !== shopId));
      } else {
        toast.error(res?.message || "Failed to reject shop");
      }
    } catch {
      toast.error("Error rejecting shop");
    } finally {
      setShopActionLoading(null);
    }
  };

  const idTypeLabels: Record<string, string> = {
    national_id: "NIN",
    drivers_license: "Driver's License",
    passport: "Passport",
    voters_card: "Voter's Card",
  };

  return (
    <div className="min-h-screen">

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-taja-light via-white to-slate-50 motif-blanc" />
      <div className="fixed top-[-10%] right-[-5%] w-80 h-80 rounded-full bg-taja-primary/5 blur-3xl -z-10" />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8 p-1">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-[1.2rem] bg-slate-950 shadow-huge flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Trust Registry</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Authenticity Reviews</h1>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          {[
            { key: "all", label: "Global Registry", icon: Users, color: "bg-white border-slate-100 shadow-sm" },
            { key: "pending", label: "Pending Audit", icon: Clock, color: "bg-white border-slate-100 shadow-sm" },
            { key: "approved", label: "Verified", icon: BadgeCheck, color: "bg-white border-slate-100 shadow-sm" },
            { key: "rejected", label: "Restricted", icon: Ban, color: "bg-white border-slate-100 shadow-sm" },
          ].map(({ key, label, icon: Icon, color }) => (
            <button key={key} onClick={() => setFilter(key as any)}
              className={`flex flex-col gap-4 p-6 rounded-[2rem] transition-all text-left border ${color} ${filter === key ? "ring-4 ring-emerald-500/10 border-emerald-500 shadow-huge" : "hover:shadow-huge hover:border-emerald-200 hover:-translate-y-1"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <Icon className={`h-4 w-4 ${filter === key ? "text-emerald-500" : "text-slate-300"}`} />
              </div>
              <span className={`text-4xl font-black ${filter === key ? "text-emerald-600" : "text-slate-900"}`}>{stats[key as keyof typeof stats]}</span>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${filter === f ? "bg-slate-950 text-white shadow-huge scale-105" : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600"}`}>
              {f} ({stats[f]})
            </button>
          ))}
        </div>

        {/* Identity (KYC) list */}
        {loading ? (
          <div className="flex items-center justify-center h-48 glass-panel rounded-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-taja-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-16 text-center shadow-huge">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-slate-200" />
            </div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">All Clear: No {filter === "all" ? "" : filter} requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((sub) => {
              const cfg = STATUS_CONFIG[sub.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === sub._id;
              const isActing = actionLoading === sub.userId._id;

              return (
                <div key={sub._id} className={`bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-sm hover:shadow-huge ${isExpanded ? "ring-4 ring-emerald-500/5 border-emerald-500/20" : ""}`}>
                  {/* Row header */}
                  <button className="w-full flex items-center justify-between p-7 text-left gap-6 group" onClick={() => setExpandedId(isExpanded ? null : sub._id)}>
                    <div className="flex items-center gap-5 min-w-0">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                        <span className="text-emerald-400 text-base font-black uppercase">{sub.userId.fullName?.[0] ?? "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-black text-slate-900 tracking-tight">{sub.userId.fullName}</p>
                        <p className="text-xs font-bold text-slate-400">{sub.userId.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <span className={`hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.pill}`}>
                        <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${cfg.iconColor === 'text-emerald-500' ? 'bg-emerald-500' : cfg.iconColor === 'text-amber-500' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline">{new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      <div className={`p-2 rounded-xl transition-all ${isExpanded ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"}`}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="px-5 pb-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2 mb-8">
                        {[
                          { label: "Establishment", value: sub.businessName || "—" },
                          { label: "Business Type", value: sub.businessType || "—" },
                          { label: "Reg. Number", value: sub.businessRegistrationNumber || "N/A" },
                          { label: "Credential", value: idTypeLabels[sub.idType] || sub.idType },
                          { label: "ID Number", value: sub.idNumber },
                          { label: "Bank Name", value: sub.bankName || "—" },
                          { label: "Account Number", value: sub.accountNumber || "—" },
                          { label: "Account Name", value: sub.accountName || "—" },
                          { label: "BVN", value: sub.bankVerificationNumber || "N/A" },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group/item hover:border-emerald-500/20 transition-all">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                            <p className="text-sm font-black text-slate-900 break-words tracking-tight">{value}</p>
                          </div>
                        ))}
                      </div>

                      {sub.status === "rejected" && sub.rejectionReason && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                            <p className="text-sm text-red-600 mt-0.5">{sub.rejectionReason}</p>
                          </div>
                        </div>
                      )}

                      {sub.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              placeholder="Reason (Required for Rejections)"
                              value={rejectReason[sub.userId._id] || ""}
                              onChange={(e) => setRejectReason((prev) => ({ ...prev, [sub.userId._id]: e.target.value }))}
                              className="w-full h-12 px-5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-sm font-bold transition-all"
                            />
                          </div>
                          <div className="flex gap-4 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => handleReject(sub.userId._id)} disabled={isActing}
                              className="h-12 flex-1 sm:flex-initial px-8 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]">
                              {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              Reject
                            </Button>
                            <Button variant="gradient" onClick={() => handleApprove(sub.userId._id)} disabled={isActing}
                              className="h-12 flex-1 sm:flex-initial px-8 rounded-2xl flex items-center justify-center gap-2 bg-slate-950 hover:bg-emerald-600 text-white transition-all font-black uppercase tracking-widest text-[10px] shadow-huge border-none">
                              {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              Approve
                            </Button>
                          </div>
                        </div>
                      )}

                      {sub.status !== "pending" && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold ${sub.status === "approved" ? "bg-taja-light text-taja-primary border border-taja-primary/20" : "bg-red-50 text-red-700 border border-red-200"}`}>
                          <StatusIcon className="h-4 w-4" />
                          This submission was {sub.status}.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Seller / Shop Verification */}
        <div className="mt-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Store className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verification</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                New Shop Requests
              </h2>
            </div>
          </div>

          {shopsLoading ? (
            <div className="flex items-center justify-center h-32 glass-panel rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin text-taja-primary" />
            </div>
          ) : shops.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-sm text-gray-500">
              No shops are awaiting verification.
            </div>
          ) : (
            <div className="space-y-4">
              {shops.map((shop) => (
                <div
                  key={shop._id}
                  className="glass-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-lg font-black text-slate-900 tracking-tight">
                        {shop.shopName}
                      </p>
                      <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-black tracking-widest uppercase">
                        {shop.verificationStatus === "pending" ? "Waiting" : shop.verificationStatus}
                      </span>
                    </div>
                    {shop.owner && (
                      <p className="text-xs font-bold text-slate-400">
                        Merchant:{" "}
                        <span className="text-slate-900">
                          {shop.owner.fullName}
                        </span>{" "}
                        • {shop.owner.email}
                      </p>
                    )}
                    {shop.description && (
                      <p className="text-sm font-medium text-slate-600 mt-2 line-clamp-2 italic leading-relaxed">
                        "{shop.description}"
                      </p>
                    )}
                    <p className="text-[10px] font-black text-slate-300 uppercase mt-3 tracking-widest border-t border-slate-50 pt-3 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Request Sent {new Date(shop.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-3 sm:flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={shopActionLoading === shop._id}
                      onClick={() => handleShopReject(shop._id)}
                      className="h-10 px-5 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                    >
                      {shopActionLoading === shop._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="gradient"
                      disabled={shopActionLoading === shop._id}
                      onClick={() => handleShopApprove(shop._id)}
                      className="h-10 px-6 rounded-2xl bg-slate-950 hover:bg-emerald-600 text-white border-none font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-huge transition-all"
                    >
                      {shopActionLoading === shop._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
