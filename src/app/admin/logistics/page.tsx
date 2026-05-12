"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Search,
  Loader2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RiderProvisionModals,
  type RiderProvisionCredentials,
  type RiderProvisionConfirmTarget,
} from "@/components/admin/RiderProvisionModals";

type LogisticsPartner = {
  _id: string;
  user?: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  status: "pending_review" | "approved" | "rejected" | "suspended";
  trust?: {
    kycStatus?: "pending" | "verified" | "rejected";
    trustTier?: 0 | 1 | 2 | 3;
    guarantorFormStatus?: "not_submitted" | "submitted" | "approved" | "rejected";
    selfieImage?: string;
    idFrontImage?: string;
    guarantorForm?: {
      fullName?: string;
      phone?: string;
      relationship?: string;
      address?: string;
      idType?: string;
      idFrontImage?: string;
      selfieImage?: string;
      submittedAt?: string;
    };
  };
  risk?: { level?: "normal" | "watchlist" | "blacklist"; reasonCode?: string; reasonNotes?: string };
  payout?: { holdUntil?: string };
  verification?: { emailOtp?: { verifiedAt?: string } };
  coverage?: { city?: string; state?: string };
  availability?: { isOnline?: boolean };
  createdAt?: string;
};

type DispatchJob = {
  _id: string;
  order?: string;
  status: "open" | "reserved" | "picked_up" | "delivered" | "cancelled" | "disputed";
  valueKobo: number;
  deliveryFeeKobo: number;
  pickup?: { city?: string; state?: string; address?: string };
  dropoff?: { city?: string; state?: string; address?: string };
  broadcast?: { expiresAt?: string };
};

type DeliveryEventItem = {
  _id: string;
  eventType: string;
  actorRole: "admin" | "logistics" | "system";
  actorUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export default function AdminLogisticsPage() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [items, setItems] = useState<LogisticsPartner[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobs, setJobs] = useState<DispatchJob[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);
  const [jobOrderId, setJobOrderId] = useState("");
  const [jobPickupAddress, setJobPickupAddress] = useState("");
  const [jobRadiusKm, setJobRadiusKm] = useState("10");
  const [jobTtlMinutes, setJobTtlMinutes] = useState("20");
  const [jobDeliveryFeeKobo, setJobDeliveryFeeKobo] = useState("0");
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [runningDispatchCron, setRunningDispatchCron] = useState(false);
  const [timelineJobId, setTimelineJobId] = useState<string | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<DeliveryEventItem[]>([]);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [provisionConfirm, setProvisionConfirm] = useState<RiderProvisionConfirmTarget | null>(null);
  const [provisionCredentials, setProvisionCredentials] = useState<RiderProvisionCredentials | null>(null);

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
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const res = await api("/api/admin/logistics/jobs?limit=20");
      if (res?.success) setJobs(res.data.items || []);
      else toast.error(res?.message || "Failed to load dispatch jobs");
    } catch (error: any) {
      toast.error(error?.message || "Failed to load dispatch jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const createDispatchJob = async () => {
    if (!jobOrderId.trim()) {
      toast.error("Enter a valid order ID");
      return;
    }
    try {
      setBroadcasting(true);
      const res = await api("/api/admin/logistics/jobs/broadcast", {
        method: "POST",
        body: JSON.stringify({
          orderId: jobOrderId.trim(),
          pickupAddress: jobPickupAddress.trim() || undefined,
          radiusKm: Number(jobRadiusKm || "10"),
          ttlMinutes: Number(jobTtlMinutes || "20"),
          deliveryFeeKobo: Number(jobDeliveryFeeKobo || "0"),
        }),
      });
      if (res?.success) {
        toast.success(
          `Dispatch job created. Pickup OTP: ${res?.data?.otp?.pickupCode}, Delivery OTP: ${res?.data?.otp?.deliveryCode}`
        );
        setJobOrderId("");
        setJobPickupAddress("");
        await loadJobs();
      } else {
        toast.error(res?.message || "Failed to create dispatch job");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create dispatch job");
    } finally {
      setBroadcasting(false);
    }
  };

  const reassignJob = async (id: string) => {
    try {
      setReassigningId(id);
      const res = await api(`/api/admin/logistics/jobs/${id}/reassign`, { method: "POST" });
      if (res?.success) {
        toast.success("Job returned to open queue");
        await loadJobs();
      } else {
        toast.error(res?.message || "Failed to reassign job");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to reassign job");
    } finally {
      setReassigningId(null);
    }
  };

  const runDispatchCronNow = async () => {
    try {
      setRunningDispatchCron(true);
      const res = await api("/api/cron/logistics-dispatch", { method: "POST" });
      if (res?.success) {
        const requeued = Number(res?.data?.requeuedClaims || 0);
        const cancelled = Number(res?.data?.cancelledExpiredOpenJobs || 0);
        toast.success(`Dispatch cron done. Requeued: ${requeued}, Cancelled: ${cancelled}`);
        await loadJobs();
      } else {
        toast.error(res?.message || "Failed to run dispatch cron");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to run dispatch cron");
    } finally {
      setRunningDispatchCron(false);
    }
  };

  const loadTimeline = async (jobId: string) => {
    try {
      setTimelineJobId(jobId);
      setTimelineLoading(true);
      const res = await api(`/api/admin/logistics/jobs/${jobId}/events?limit=120`);
      if (res?.success) {
        setTimelineEvents(res.data || []);
      } else {
        setTimelineEvents([]);
        toast.error(res?.message || "Failed to load timeline");
      }
    } catch (error: any) {
      setTimelineEvents([]);
      toast.error(error?.message || "Failed to load timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  const executeProvision = async () => {
    if (!provisionConfirm) return;
    const id = provisionConfirm.partnerId;
    try {
      setProvisioningId(id);
      const res = await api(`/api/admin/logistics/${id}/provision-access`, { method: "POST" });
      if (res?.success && res?.data?.temporaryPassword) {
        const mode: RiderProvisionCredentials["mode"] =
          res.data.mode === "password_rotated" ? "password_rotated" : "account_created";
        setProvisionConfirm(null);
        setProvisionCredentials({
          partnerId: id,
          email: res.data.email,
          temporaryPassword: res.data.temporaryPassword,
          mode,
        });
        toast.success(
          mode === "password_rotated" ? "New rider password issued" : "Rider portal access ready"
        );
        await load();
      } else {
        toast.error(res?.message || "Provisioning failed");
      }
    } catch (error: any) {
      toast.error(error?.message || "Provisioning failed");
    } finally {
      setProvisioningId(null);
    }
  };

  const review = async (
    id: string,
    payload: {
      status?: string;
      kycStatus?: string;
      riskLevel?: string;
      riskReasonCode?: string;
      riskReasonNotes?: string;
      trustTier?: number;
      maxOrderValueKobo?: number;
      maxRadiusKm?: number;
      maxConcurrentJobs?: number;
      guarantorFormStatus?: string;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-taja-primary/20 transition-all"
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
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
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
        >
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="mb-8">
        <Button
          type="button"
          onClick={load}
          className="w-full sm:w-auto h-11 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900"
        >
          Apply filters
        </Button>
      </div>

      <Card className="mb-8 rounded-[2rem] border-slate-100 shadow-premium overflow-hidden">
        <CardContent className="p-5 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Dispatch Job Board</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              Real-time broadcast & Fallback Management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Order ID</label>
              <input
                className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 transition-all"
                placeholder="Enter order reference"
                value={jobOrderId}
                onChange={(e) => setJobOrderId(e.target.value)}
              />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pickup Address (Optional)</label>
              <input
                className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 transition-all"
                placeholder="Specific pickup location"
                value={jobPickupAddress}
                onChange={(e) => setJobPickupAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 md:col-span-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Radius (KM)</label>
                <input
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-slate-50/50"
                  placeholder="10"
                  value={jobRadiusKm}
                  onChange={(e) => setJobRadiusKm(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">TTL (Mins)</label>
                <input
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-slate-50/50"
                  placeholder="20"
                  value={jobTtlMinutes}
                  onChange={(e) => setJobTtlMinutes(e.target.value)}
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery Fee (Kobo)</label>
                <input
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold bg-slate-50/50"
                  placeholder="0"
                  value={jobDeliveryFeeKobo}
                  onChange={(e) => setJobDeliveryFeeKobo(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button
                type="button"
                disabled={broadcasting}
                onClick={createDispatchJob}
                className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-taja-primary hover:bg-taja-primary/90 shadow-lg shadow-taja-primary/20"
              >
                {broadcasting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Dispatch Job"
                )}
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Recent delivery jobs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadJobs}
                  className="flex-1 sm:flex-none h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-200"
                >
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={runningDispatchCron}
                  onClick={runDispatchCronNow}
                  className="flex-1 sm:flex-none h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-200"
                >
                  {runningDispatchCron ? "Running..." : "Run Cron"}
                </Button>
              </div>
            </div>
            
            {jobsLoading ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Updating jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <p className="py-8 text-center text-xs font-bold text-slate-300 uppercase tracking-[0.2em] border-2 border-dashed border-slate-50 rounded-2xl">
                No active dispatch jobs
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jobs.map((job) => (
                  <div key={job._id} className="group relative rounded-2xl border border-slate-100 bg-slate-50/30 p-4 hover:bg-white hover:border-taja-primary/20 hover:shadow-premium transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm",
                            job.status === 'open' ? 'bg-blue-100 text-blue-700' :
                            job.status === 'reserved' ? 'bg-amber-100 text-amber-700' :
                            job.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          )}>
                            {job.status}
                          </span>
                          <span className="text-xs font-black text-slate-900">₦{(job.valueKobo / 100).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 truncate max-w-[140px]">{job._id}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={reassigningId === job._id}
                          onClick={() => reassignJob(job._id)}
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => loadTimeline(job._id)}
                          className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100"
                        >
                          Timeline
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <p className="text-[10px] font-bold text-slate-600 truncate">
                          <span className="text-slate-400 mr-1">FROM:</span>
                          {job.pickup?.city || "-"}, {job.pickup?.state || "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-taja-primary" />
                        <p className="text-[10px] font-bold text-slate-600 truncate">
                          <span className="text-slate-400 mr-1">TO:</span>
                          {job.dropoff?.city || "-"}, {job.dropoff?.state || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {timelineJobId ? (
            <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50/40 p-6 sm:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Delivery event timeline
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{timelineJobId}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTimelineJobId(null)}
                  className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-slate-200"
                >
                  Close
                </Button>
              </div>
              <div className="space-y-3 relative">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
                {timelineLoading ? (
                  <div className="flex items-center gap-3 py-4 pl-10">
                    <Loader2 className="h-4 w-4 animate-spin text-taja-primary" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching history...</p>
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <p className="pl-10 text-xs font-bold text-slate-300 uppercase tracking-widest py-4">No events logged yet.</p>
                ) : (
                  timelineEvents.map((ev) => (
                    <div key={ev._id} className="relative pl-10">
                      <div className="absolute left-3.5 top-3 w-1.5 h-1.5 rounded-full bg-slate-400 shadow-[0_0_0_4px_rgba(255,255,255,1)]" />
                      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg">
                            {ev.eventType.replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {new Date(ev.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Actor:</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-taja-primary">{ev.actorRole}</span>
                        </div>
                        {ev.metadata ? (
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 text-[10px] font-medium text-slate-600 border border-slate-100">
                            {JSON.stringify(ev.metadata, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[2.5rem] border-slate-100 shadow-premium overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Partners</h2>
            <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-500">{items.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-taja-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing partner data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-300 uppercase tracking-widest italic">No logistics partners found.</p>
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-50 bg-slate-50/30">
                      <th className="px-6 py-4">Partner Profile</th>
                      <th className="px-6 py-4">Asset Info</th>
                      <th className="px-6 py-4">Coverage</th>
                      <th className="px-6 py-4">Status & Reach</th>
                      <th className="px-6 py-4">Trust & KYC</th>
                      <th className="px-6 py-4">Fraud Risk</th>
                      <th className="px-6 py-4 text-right">Operational Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors align-top group">
                        <td className="px-6 py-6 min-w-[240px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                              {p.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 group-hover:text-taja-primary transition-colors">{p.fullName}</p>
                              <p className="text-[10px] font-bold text-slate-400 truncate max-w-[160px]">{p.email}</p>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">{p.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg inline-block w-fit">
                              {p.vehicleType}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">Standard Vehicle</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-[11px] font-black text-slate-700">{p.coverage?.city || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.coverage?.state || "N/A"}</p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                              p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                              p.status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                              'bg-rose-50 text-rose-700'
                            )}>
                              {p.status}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className={cn("w-1.5 h-1.5 rounded-full", p.availability?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {p.availability?.isOnline ? "Live Now" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                                {p.trust?.kycStatus || "pending"}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100/50">
                                T{p.trust?.trustTier ?? 0}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {p.trust?.idFrontImage && (
                                <a href={p.trust.idFrontImage} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:underline">ID Card</a>
                              )}
                              {p.trust?.selfieImage && (
                                <a href={p.trust.selfieImage} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-blue-600 hover:underline">Selfie</a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                            p.risk?.level === 'normal' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'
                          )}>
                            {p.risk?.level || "normal"}
                          </span>
                          {p.risk?.reasonCode && (
                            <p className="mt-1.5 text-[9px] font-bold text-rose-500 uppercase tracking-widest truncate max-w-[100px]">{p.risk.reasonCode}</p>
                          )}
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex flex-wrap justify-end gap-2 max-w-[320px] ml-auto">
                            <Button
                              size="sm"
                              className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-taja-primary transition-all"
                              disabled={provisioningId === p._id || savingId === p._id || p.status !== "approved"}
                              onClick={() => setProvisionConfirm({ partnerId: p._id, partnerName: p.fullName, hasExistingRider: Boolean(p.user) })}
                            >
                              {provisioningId === p._id ? "..." : p.user ? "Reset" : "Issue Access"}
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600"
                              disabled={savingId === p._id}
                              onClick={() => review(p._id, { status: "approved", kycStatus: "verified", trustTier: 0, maxOrderValueKobo: 200000, maxRadiusKm: 10, maxConcurrentJobs: 1 }, "Verified")}
                            >
                              Approve
                            </Button>
                            <div className="flex gap-1 w-full justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 rounded-lg text-[8px] font-black uppercase border-slate-100"
                                disabled={savingId === p._id}
                                onClick={() => review(p._id, { status: "suspended", riskLevel: "watchlist", riskReasonCode: "suspicious_activity" }, "Suspended")}
                              >
                                Suspend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 rounded-lg text-[8px] font-black uppercase border-slate-100 text-rose-500"
                                disabled={savingId === p._id}
                                onClick={() => review(p._id, { status: "rejected", kycStatus: "rejected" }, "Rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Card List */}
              <div className="lg:hidden divide-y divide-slate-50">
                {items.map((p) => (
                  <div key={p._id} className="p-5 sm:p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg">
                          {p.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{p.fullName}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-[180px] mt-0.5">{p.email}</p>
                          <p className="text-[10px] font-bold text-slate-500">{p.phone}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                          p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {p.status}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className={cn("w-1.5 h-1.5 rounded-full", p.availability?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                          <span className="text-[8px] font-black uppercase text-slate-400">{p.availability?.isOnline ? "LIVE" : "AWAY"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Asset & Location</p>
                        <p className="text-[10px] font-black text-slate-700 uppercase">{p.vehicleType}</p>
                        <p className="text-[9px] font-bold text-slate-500">{p.coverage?.city || "Unknown"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Trust Metrics</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">KYC: {p.trust?.kycStatus || "..."}</span>
                        </div>
                        <p className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest">Trust Tier {p.trust?.trustTier ?? 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="flex-1 min-w-[120px] h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white"
                        disabled={provisioningId === p._id || savingId === p._id || p.status !== "approved"}
                        onClick={() => setProvisionConfirm({ partnerId: p._id, partnerName: p.fullName, hasExistingRider: Boolean(p.user) })}
                      >
                        {provisioningId === p._id ? "..." : p.user ? "Reset Access" : "Issue Access"}
                      </Button>
                      <Button
                        className="flex-1 min-w-[120px] h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white"
                        disabled={savingId === p._id}
                        onClick={() => review(p._id, { status: "approved", kycStatus: "verified", trustTier: 0, maxOrderValueKobo: 200000, maxRadiusKm: 10, maxConcurrentJobs: 1 }, "Verified")}
                      >
                        Approve
                      </Button>
                      <div className="grid grid-cols-2 gap-2 w-full mt-1">
                        <Button
                          variant="outline"
                          className="h-9 rounded-xl text-[8px] font-black uppercase border-slate-100"
                          disabled={savingId === p._id}
                          onClick={() => review(p._id, { status: "suspended", riskLevel: "watchlist", riskReasonCode: "suspicious_activity" }, "Suspended")}
                        >
                          Suspend
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 rounded-xl text-[8px] font-black uppercase border-slate-100 text-rose-500"
                          disabled={savingId === p._id}
                          onClick={() => review(p._id, { status: "rejected", kycStatus: "rejected" }, "Rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <RiderProvisionModals
        confirmTarget={provisionConfirm}
        credentials={provisionCredentials}
        confirmLoading={Boolean(provisionConfirm && provisioningId === provisionConfirm.partnerId)}
        onCloseConfirm={() => setProvisionConfirm(null)}
        onConfirmProvision={executeProvision}
        onCloseCredentials={() => setProvisionCredentials(null)}
      />
    </div>
  );
}
