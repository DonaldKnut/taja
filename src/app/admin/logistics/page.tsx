"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Search } from "lucide-react";

type LogisticsPartner = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  status: "pending_review" | "approved" | "rejected" | "suspended";
  trust?: {
    kycStatus?: "pending" | "verified" | "rejected";
    selfieImage?: string;
    idFrontImage?: string;
  };
  risk?: { level?: "normal" | "watchlist" | "blacklist"; reasonCode?: string; reasonNotes?: string };
  payout?: { holdUntil?: string };
  verification?: { emailOtp?: { verifiedAt?: string } };
  coverage?: { city?: string; state?: string };
  availability?: { isOnline?: boolean };
  createdAt?: string;
};

export default function AdminLogisticsPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [items, setItems] = useState<LogisticsPartner[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: "1", limit: "50" });
      if (search.trim()) q.set("search", search.trim());
      if (statusFilter) q.set("status", statusFilter);
      if (kycFilter) q.set("kycStatus", kycFilter);
      const res = await api(`/api/admin/logistics?${q.toString()}`);
      if (res?.success) setItems(res.data.items || []);
      else toast.error(res?.message || "Failed to load logistics partners");
    } catch (error: any) {
      toast.error(error?.message || "Failed to load logistics partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (
    id: string,
    payload: {
      status?: string;
      kycStatus?: string;
      riskLevel?: string;
      riskReasonCode?: string;
      riskReasonNotes?: string;
    },
    successText: string
  ) => {
    try {
      setSavingId(id);
      const res = await api(`/api/admin/logistics/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res?.success) {
        toast.success(successText);
        await load();
      } else {
        toast.error(res?.message || "Failed to update");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Logistics Partners
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          Review applications, verify soft KYC, and activate trusted dispatch partners.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-sm font-semibold"
            placeholder="Search by name, email, phone, city, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <select
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
        >
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="mb-6">
        <Button
          type="button"
          onClick={load}
          className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          Apply filters
        </Button>
      </div>

      <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading logistics partners...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-500">No logistics partners found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Coverage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">KYC</th>
                    <th className="px-4 py-3">Fraud Risk</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p._id} className="border-b border-slate-50 align-top">
                      <td className="px-4 py-4 min-w-[220px]">
                        <p className="font-black text-slate-900">{p.fullName}</p>
                        <p className="text-xs font-bold text-slate-500">{p.email}</p>
                        <p className="text-xs font-bold text-slate-400">{p.phone}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold uppercase">{p.vehicleType}</td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {p.coverage?.city || "-"}, {p.coverage?.state || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {p.status}
                        </span>
                        <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {p.availability?.isOnline ? "Online" : "Offline"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          {p.trust?.kycStatus || "pending"}
                        </span>
                        <div className="mt-2 text-xs font-semibold text-slate-500">
                          OTP: {p.verification?.emailOtp?.verifiedAt ? "verified" : "not verified"}
                        </div>
                        <div className="mt-2 flex gap-2">
                          {p.trust?.idFrontImage ? (
                            <a href={p.trust.idFrontImage} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                              View ID
                            </a>
                          ) : null}
                          {p.trust?.selfieImage ? (
                            <a href={p.trust.selfieImage} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                              View Selfie
                            </a>
                          ) : null}
                        </div>
                        {p.payout?.holdUntil ? (
                          <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                            Hold: {new Date(p.payout.holdUntil).toLocaleDateString()}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-rose-50 text-rose-700">
                          {p.risk?.level || "normal"}
                        </span>
                        {p.risk?.reasonCode ? (
                          <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-500">
                            {p.risk.reasonCode}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 min-w-[280px]">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() => review(p._id, { status: "approved", kycStatus: "verified" }, "Partner approved and KYC verified")}
                          >
                            Approve + Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() => review(p._id, { kycStatus: "pending" }, "KYC marked pending")}
                          >
                            Mark KYC Pending
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() =>
                              review(
                                p._id,
                                {
                                  status: "suspended",
                                  riskLevel: "watchlist",
                                  riskReasonCode: "suspicious_activity",
                                },
                                "Partner suspended"
                              )
                            }
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() =>
                              review(
                                p._id,
                                { riskLevel: "watchlist", riskReasonCode: "failed_delivery_pattern" },
                                "Partner moved to watchlist"
                              )
                            }
                          >
                            Watchlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() =>
                              review(
                                p._id,
                                {
                                  status: "suspended",
                                  riskLevel: "blacklist",
                                  riskReasonCode: "stolen_package_report",
                                },
                                "Partner blacklisted"
                              )
                            }
                          >
                            Blacklist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() => review(p._id, { status: "rejected", kycStatus: "rejected" }, "Application rejected")}
                          >
                            Reject
                          </Button>
                        </div>
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
