"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, uploadLogisticsKycImage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "react-hot-toast";

type LogisticsProfile = {
  _id: string;
  fullName: string;
  status: "pending_review" | "approved" | "rejected" | "suspended";
  trust?: { kycStatus?: "pending" | "verified" | "rejected" };
  availability?: { isOnline?: boolean; activeHours?: string };
  coverage?: { state?: string; city?: string; areas?: string[] };
  eligibleForAssignment?: boolean;
  requiresGuarantorForm?: boolean;
  emailOtpVerified?: boolean;
  payoutHoldActive?: boolean;
  payout?: { holdUntil?: string };
  risk?: { level?: "normal" | "watchlist" | "blacklist" };
  assignment?: {
    totalAssigned?: number;
    totalCompleted?: number;
    averageRating?: number;
    maxOrderValueKobo?: number;
    maxRadiusKm?: number;
    maxConcurrentJobs?: number;
  };
};

type NearbyJob = {
  _id: string;
  status: "open" | "reserved" | "picked_up" | "delivered" | "cancelled" | "disputed";
  valueKobo: number;
  deliveryFeeKobo: number;
  pickup?: { city?: string; state?: string; address?: string };
  dropoff?: { city?: string; state?: string; address?: string };
  broadcast?: { expiresAt?: string };
};

type ActiveJob = NearbyJob & {
  otp?: { pickupVerifiedAt?: string; deliveryVerifiedAt?: string };
  proof?: { pickupPhotos?: string[]; deliveryPhotos?: string[] };
};

export default function LogisticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<LogisticsProfile | null>(null);
  const [submittingGuarantor, setSubmittingGuarantor] = useState(false);
  const [uploadingGuarantorSelfie, setUploadingGuarantorSelfie] = useState(false);
  const [uploadingGuarantorId, setUploadingGuarantorId] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobs, setJobs] = useState<NearbyJob[]>([]);
  const [activeJobsLoading, setActiveJobsLoading] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [claimingJobId, setClaimingJobId] = useState<string | null>(null);
  const [actingJobId, setActingJobId] = useState<string | null>(null);
  const [guarantor, setGuarantor] = useState({
    fullName: "",
    phone: "",
    relationship: "",
    address: "",
    idType: "national_id",
    idNumber: "",
    idFrontImage: "",
    selfieImage: "",
  });
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdNew.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      setPwdSaving(true);
      const res = await api("/api/users/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew }),
      });
      if (res?.success) {
        toast.success("Password updated");
        setPwdCurrent("");
        setPwdNew("");
      } else {
        toast.error(res?.message || "Failed to update password");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update password");
    } finally {
      setPwdSaving(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await api("/api/logistics/me");
      setProfile(res?.data || null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load logistics profile");
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyJobs = async () => {
    try {
      setJobsLoading(true);
      const res = await api("/api/logistics/jobs/nearby");
      if (res?.success) {
        setJobs(res.data || []);
      } else {
        setJobs([]);
      }
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadActiveJobs = async () => {
    try {
      setActiveJobsLoading(true);
      const res = await api("/api/logistics/jobs/mine");
      if (res?.success) setActiveJobs(res.data || []);
      else setActiveJobs([]);
    } catch {
      setActiveJobs([]);
    } finally {
      setActiveJobsLoading(false);
    }
  };

  const uploadGuarantorImage = async (
    file: File | undefined,
    kind: "selfieImage" | "idFrontImage"
  ) => {
    if (!file) return;
    try {
      if (kind === "selfieImage") setUploadingGuarantorSelfie(true);
      if (kind === "idFrontImage") setUploadingGuarantorId(true);
      const url = await uploadLogisticsKycImage(file);
      setGuarantor((prev) => ({ ...prev, [kind]: url }));
      toast.success(kind === "selfieImage" ? "Guarantor selfie uploaded" : "Guarantor ID uploaded");
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload image");
    } finally {
      if (kind === "selfieImage") setUploadingGuarantorSelfie(false);
      if (kind === "idFrontImage") setUploadingGuarantorId(false);
    }
  };

  const submitGuarantor = async () => {
    if (
      !guarantor.fullName.trim() ||
      !guarantor.phone.trim() ||
      !guarantor.relationship.trim() ||
      !guarantor.address.trim() ||
      !guarantor.idFrontImage.trim() ||
      !guarantor.selfieImage.trim()
    ) {
      toast.error("Complete all guarantor details before submission");
      return;
    }
    try {
      setSubmittingGuarantor(true);
      const res = await api("/api/logistics/guarantor", {
        method: "POST",
        body: JSON.stringify(guarantor),
      });
      if (res?.success) {
        toast.success("Guarantor form submitted for admin approval");
        await load();
        await loadNearbyJobs();
        await loadActiveJobs();
      } else {
        toast.error(res?.message || "Failed to submit guarantor form");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit guarantor form");
    } finally {
      setSubmittingGuarantor(false);
    }
  };

  useEffect(() => {
    load();
    loadNearbyJobs();
    loadActiveJobs();
  }, []);

  const claimJob = async (jobId: string) => {
    try {
      setClaimingJobId(jobId);
      const res = await api(`/api/logistics/jobs/${jobId}/claim`, { method: "POST" });
      if (res?.success) {
        toast.success("Job claimed successfully");
        await loadNearbyJobs();
        await loadActiveJobs();
        await load();
      } else {
        toast.error(res?.message || "Unable to claim job");
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to claim job");
    } finally {
      setClaimingJobId(null);
    }
  };

  const verifyJobOtp = async (jobId: string, stage: "pickup" | "delivery") => {
    const code = window.prompt(`Enter ${stage} OTP`);
    if (!code) return;
    try {
      setActingJobId(jobId);
      const res = await api(`/api/logistics/jobs/${jobId}/otp/verify`, {
        method: "POST",
        body: JSON.stringify({ stage, code: code.trim() }),
      });
      if (res?.success) {
        toast.success(`${stage} OTP verified`);
        await loadActiveJobs();
      } else {
        toast.error(res?.message || "OTP verification failed");
      }
    } catch (error: any) {
      toast.error(error?.message || "OTP verification failed");
    } finally {
      setActingJobId(null);
    }
  };

  const uploadJobProof = async (jobId: string, stage: "pickup" | "delivery") => {
    const photoUrl = window.prompt(`Paste ${stage} proof image URL`);
    if (!photoUrl) return;
    try {
      setActingJobId(jobId);
      const res = await api(`/api/logistics/jobs/${jobId}/proof`, {
        method: "POST",
        body: JSON.stringify({ stage, photoUrl: photoUrl.trim() }),
      });
      if (res?.success) {
        toast.success(`${stage} proof uploaded`);
        await loadActiveJobs();
      } else {
        toast.error(res?.message || "Proof upload failed");
      }
    } catch (error: any) {
      toast.error(error?.message || "Proof upload failed");
    } finally {
      setActingJobId(null);
    }
  };

  const toggleOnline = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      const nextOnline = !Boolean(profile.availability?.isOnline);
      const res = await api("/api/logistics/me", {
        method: "PUT",
        body: JSON.stringify({
          isOnline: nextOnline,
          activeHours: profile.availability?.activeHours || "",
        }),
      });
      if (res?.success) {
        toast.success(nextOnline ? "You are now online" : "You are now offline");
        await load();
      } else {
        toast.error(res?.message || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async () => {
    try {
      const res = await api("/api/logistics/otp/send", { method: "POST" });
      if (res?.success) toast.success("OTP sent to your email");
      else toast.error(res?.message || "Failed to send OTP");
    } catch (error: any) {
      toast.error(error?.message || "Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    const code = window.prompt("Enter the 6-digit OTP sent to your email");
    if (!code) return;
    try {
      const res = await api("/api/logistics/otp/verify", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res?.success) {
        toast.success("Email OTP verified");
        await load();
      } else {
        toast.error(res?.message || "Failed to verify OTP");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to verify OTP");
    }
  };

  return (
    <ProtectedRoute requiredRole="logistics" redirectTo="/logistics/login">
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Logistics Dashboard</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Dispatch-ready profile with soft KYC and assignment eligibility checks.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Rider password</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Replace the temporary password from operations. You can also use{" "}
              <a href="/forgot-password" className="text-emerald-700 font-bold hover:underline">
                Forgot password
              </a>{" "}
              on the sign-in page.
            </p>
            <form onSubmit={changePassword} className="mt-4 grid gap-3 max-w-md">
              <div>
                <Label htmlFor="rider-pwd-current">Current password</Label>
                <Input
                  id="rider-pwd-current"
                  type="password"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  required
                  className="mt-1 h-10 rounded-xl"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <Label htmlFor="rider-pwd-new">New password</Label>
                <Input
                  id="rider-pwd-new"
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1 h-10 rounded-xl"
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                disabled={pwdSaving}
                variant="outline"
                className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit"
              >
                {pwdSaving ? "Saving…" : "Update password"}
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-sm font-semibold text-slate-500">Loading profile...</div>
          ) : !profile ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8">
              <p className="text-sm font-semibold text-slate-600">No logistics profile found yet.</p>
              <a href="/logistics/apply" className="mt-4 inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-[10px] font-black uppercase tracking-widest text-white">
                Apply as logistics partner
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                <p className="text-lg font-black text-slate-900">{profile.status.replace("_", " ")}</p>
                <p className="text-sm font-semibold text-slate-500">
                  KYC: {profile.trust?.kycStatus || "pending"}
                </p>
                <p className="text-sm font-semibold text-slate-500">
                  Email OTP: {profile.emailOtpVerified ? "Verified" : "Not verified"}
                </p>
                <p className="text-sm font-semibold text-slate-500">
                  Risk level: {profile.risk?.level || "normal"}
                </p>
                <p className="text-sm font-semibold text-slate-500">
                  Eligible for assignment: {profile.eligibleForAssignment ? "Yes" : "No"}
                </p>
                {profile.requiresGuarantorForm ? (
                  <p className="text-sm font-semibold text-amber-700">
                    Complete guarantor form to unlock delivery jobs.
                  </p>
                ) : null}
                <div className="pt-2 flex flex-wrap gap-2">
                  <Button onClick={sendOtp} variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Send email OTP
                  </Button>
                  <Button onClick={verifyOtp} variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Verify OTP
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availability</p>
                <p className="text-sm font-semibold text-slate-700">
                  Active hours: {profile.availability?.activeHours || "Not set"}
                </p>
                <Button onClick={toggleOnline} disabled={saving} className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {saving
                    ? "Updating..."
                    : profile.availability?.isOnline
                    ? "Go offline"
                    : "Go online"}
                </Button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coverage</p>
                <p className="text-sm font-semibold text-slate-700">
                  {profile.coverage?.city}, {profile.coverage?.state}
                </p>
                <p className="text-sm font-semibold text-slate-500">
                  Areas: {(profile.coverage?.areas || []).join(", ") || "Not specified"}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery performance</p>
                <p className="text-sm font-semibold text-slate-700">
                  Assigned: {profile.assignment?.totalAssigned || 0}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Completed: {profile.assignment?.totalCompleted || 0}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Rating: {profile.assignment?.averageRating || 0}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Order value cap: ₦{((profile.assignment?.maxOrderValueKobo || 0) / 100).toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Radius cap: {profile.assignment?.maxRadiusKm || 0} km
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Payout hold: {profile.payoutHoldActive ? "Active" : "Cleared"}
                </p>
                {profile.payout?.holdUntil ? (
                  <p className="text-xs font-semibold text-slate-500">
                    Hold until: {new Date(profile.payout.holdUntil).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {profile?.eligibleForAssignment ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">Nearby Delivery Jobs</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadNearbyJobs}
                  className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Refresh
                </Button>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                First-to-accept queue filtered by your city and trust cap.
              </p>
              <div className="mt-5 space-y-3">
                {jobsLoading ? (
                  <p className="text-sm font-semibold text-slate-500">Loading jobs...</p>
                ) : jobs.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">No nearby open jobs right now.</p>
                ) : (
                  jobs.map((job) => (
                    <div key={job._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-900">
                          Job Value: ₦{(job.valueKobo / 100).toLocaleString()}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Expires:{" "}
                          {job.broadcast?.expiresAt
                            ? new Date(job.broadcast.expiresAt).toLocaleTimeString()
                            : "n/a"}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Pickup: {job.pickup?.address || "-"}, {job.pickup?.city || "-"}
                      </p>
                      <p className="text-sm font-semibold text-slate-600">
                        Dropoff: {job.dropoff?.address || "-"}, {job.dropoff?.city || "-"}
                      </p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          onClick={() => claimJob(job._id)}
                          disabled={claimingJobId === job._id}
                          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          {claimingJobId === job._id ? "Claiming..." : "Claim Job"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {profile?.eligibleForAssignment ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">My Active Jobs</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadActiveJobs}
                  className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Refresh
                </Button>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Verify OTP chain and upload proof at each custody step.
              </p>
              <div className="mt-5 space-y-3">
                {activeJobsLoading ? (
                  <p className="text-sm font-semibold text-slate-500">Loading active jobs...</p>
                ) : activeJobs.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">No active jobs yet.</p>
                ) : (
                  activeJobs.map((job) => (
                    <div key={job._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-900">
                          Status: {job.status.replace("_", " ")}
                        </p>
                        <p className="text-sm font-black text-slate-900">
                          Value: ₦{(job.valueKobo / 100).toLocaleString()}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Pickup proof: {job.proof?.pickupPhotos?.length || 0} | Delivery proof:{" "}
                        {job.proof?.deliveryPhotos?.length || 0}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => verifyJobOtp(job._id, "pickup")}
                          disabled={actingJobId === job._id}
                          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Verify Pickup OTP
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => uploadJobProof(job._id, "pickup")}
                          disabled={actingJobId === job._id}
                          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Upload Pickup Proof
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => verifyJobOtp(job._id, "delivery")}
                          disabled={actingJobId === job._id}
                          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Verify Delivery OTP
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => uploadJobProof(job._id, "delivery")}
                          disabled={actingJobId === job._id}
                          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Upload Delivery Proof
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {profile?.requiresGuarantorForm ? (
            <div className="bg-white rounded-3xl border border-amber-200 p-6 sm:p-8">
              <h2 className="text-xl font-black text-slate-900">Guarantor Form Required</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Your account is verified. Submit guarantor details for final trust approval before going online.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gFullName">Guarantor full name</Label>
                  <Input id="gFullName" value={guarantor.fullName} onChange={(e) => setGuarantor((p) => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="gPhone">Guarantor phone</Label>
                  <Input id="gPhone" value={guarantor.phone} onChange={(e) => setGuarantor((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="gRel">Relationship</Label>
                  <Input id="gRel" value={guarantor.relationship} onChange={(e) => setGuarantor((p) => ({ ...p, relationship: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="gIdType">Guarantor ID type</Label>
                  <select
                    id="gIdType"
                    value={guarantor.idType}
                    onChange={(e) => setGuarantor((p) => ({ ...p, idType: e.target.value }))}
                    className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
                  >
                    <option value="national_id">National ID</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                    <option value="passport">Passport</option>
                    <option value="voters_card">Voter&apos;s Card</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="gAddress">Address</Label>
                  <Textarea id="gAddress" rows={3} value={guarantor.address} onChange={(e) => setGuarantor((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="gIdNum">Guarantor ID number (optional)</Label>
                  <Input id="gIdNum" value={guarantor.idNumber} onChange={(e) => setGuarantor((p) => ({ ...p, idNumber: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Guarantor selfie</Label>
                  <Input type="file" accept="image/*" onChange={(e) => uploadGuarantorImage(e.target.files?.[0], "selfieImage")} />
                  {uploadingGuarantorSelfie ? <p className="text-xs font-semibold text-slate-500">Uploading selfie...</p> : null}
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Guarantor ID image</Label>
                  <Input type="file" accept="image/*" onChange={(e) => uploadGuarantorImage(e.target.files?.[0], "idFrontImage")} />
                  {uploadingGuarantorId ? <p className="text-xs font-semibold text-slate-500">Uploading ID...</p> : null}
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={submitGuarantor} disabled={submittingGuarantor || uploadingGuarantorId || uploadingGuarantorSelfie} className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  {submittingGuarantor ? "Submitting..." : "Submit Guarantor Form"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
