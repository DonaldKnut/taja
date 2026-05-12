"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Search } from "lucide-react";
import {
  RiderProvisionModals,
  type RiderProvisionCredentials,
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

      <Card className="mb-6 rounded-3xl border-slate-100 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Dispatch Job Board</h2>
            <p className="text-sm font-semibold text-slate-500">
              Create first-to-accept nearby broadcasts and manage fallback reassignment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold md:col-span-2"
              placeholder="Order ID"
              value={jobOrderId}
              onChange={(e) => setJobOrderId(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold md:col-span-2"
              placeholder="Pickup address (optional)"
              value={jobPickupAddress}
              onChange={(e) => setJobPickupAddress(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              placeholder="Radius km"
              value={jobRadiusKm}
              onChange={(e) => setJobRadiusKm(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
              placeholder="TTL mins"
              value={jobTtlMinutes}
              onChange={(e) => setJobTtlMinutes(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold md:col-span-2"
              placeholder="Delivery fee kobo"
              value={jobDeliveryFeeKobo}
              onChange={(e) => setJobDeliveryFeeKobo(e.target.value)}
            />
            <div className="md:col-span-4">
              <Button
                type="button"
                disabled={broadcasting}
                onClick={createDispatchJob}
                className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                {broadcasting ? "Creating..." : "Create Dispatch Job"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Recent delivery jobs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadJobs}
                  className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                >
                  Refresh jobs
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={runningDispatchCron}
                  onClick={runDispatchCronNow}
                  className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                >
                  {runningDispatchCron ? "Running..." : "Run Dispatch Cron"}
                </Button>
              </div>
            </div>
            {jobsLoading ? (
              <p className="text-sm font-semibold text-slate-500">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm font-semibold text-slate-500">No dispatch jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job._id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-900">
                        {job.status} - ₦{(job.valueKobo / 100).toLocaleString()}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={reassigningId === job._id}
                        onClick={() => reassignJob(job._id)}
                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        {reassigningId === job._id ? "Releasing..." : "Reassign"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => loadTimeline(job._id)}
                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        Timeline
                      </Button>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Pickup: {job.pickup?.city || "-"}, {job.pickup?.state || "-"} | Dropoff:{" "}
                      {job.dropoff?.city || "-"}, {job.dropoff?.state || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {timelineJobId ? (
            <div className="mt-2 rounded-2xl border border-slate-200 p-4 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Delivery event timeline ({timelineJobId})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTimelineJobId(null)}
                  className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                >
                  Close
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {timelineLoading ? (
                  <p className="text-sm font-semibold text-slate-500">Loading timeline...</p>
                ) : timelineEvents.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">No events logged yet.</p>
                ) : (
                  timelineEvents.map((ev) => (
                    <div key={ev._id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-700">
                          {ev.eventType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {new Date(ev.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Actor: {ev.actorRole}
                      </p>
                      {ev.metadata ? (
                        <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">
                          {JSON.stringify(ev.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

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
                    <th className="px-4 py-3">Trust</th>
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
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700">
                          Tier {p.trust?.trustTier ?? 0}
                        </span>
                        <div className="mt-2 text-xs font-semibold text-slate-500">
                          Guarantor: {(p.trust?.guarantorFormStatus || "not_submitted").replace("_", " ")}
                        </div>
                        {p.trust?.guarantorForm?.fullName ? (
                          <div className="mt-2 text-xs font-semibold text-slate-600">
                            {p.trust.guarantorForm.fullName} ({p.trust.guarantorForm.relationship || "relationship n/a"})
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
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800"
                            disabled={
                              provisioningId === p._id ||
                              savingId === p._id ||
                              p.status !== "approved"
                            }
                            onClick={() =>
                              setProvisionConfirm({
                                partnerId: p._id,
                                partnerName: p.fullName,
                                hasExistingRider: Boolean(p.user),
                              })
                            }
                          >
                            {provisioningId === p._id
                              ? "Working…"
                              : p.user
                                ? "Reset password"
                                : "Issue rider login"}
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() =>
                              review(
                                p._id,
                                {
                                  status: "approved",
                                  kycStatus: "verified",
                                  trustTier: 0,
                                  maxOrderValueKobo: 200000,
                                  maxRadiusKm: 10,
                                  maxConcurrentJobs: 1,
                                },
                                "Partner approved with Tier 0 limits"
                              )
                            }
                          >
                            Approve + Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() =>
                              review(
                                p._id,
                                { guarantorFormStatus: "approved" },
                                "Guarantor form approved"
                              )
                            }
                          >
                            Approve Guarantor
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            disabled={savingId === p._id}
                            onClick={() =>
                              review(
                                p._id,
                                { guarantorFormStatus: "rejected" },
                                "Guarantor form rejected"
                              )
                            }
                          >
                            Reject Guarantor
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
                                  trustTier: 1,
                                  maxOrderValueKobo: 1500000,
                                  maxRadiusKm: 20,
                                  maxConcurrentJobs: 2,
                                },
                                "Promoted to Tier 1 limits"
                              )
                            }
                          >
                            Promote Tier 1
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
