"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { api, uploadLogisticsKycImage } from "@/lib/api";
import {
  GUARANTOR_RELATIONSHIP_DISCLAIMER,
  getGuarantorRelationshipRejection,
} from "@/lib/guarantorRelationshipGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "react-hot-toast";
import { OTPModal } from "@/components/ui/OTPModal";

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

import { 
  Truck, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  TrendingUp, 
  Smartphone, 
  Activity, 
  Clock, 
  Award, 
  ChevronRight, 
  Loader2, 
  UserCheck, 
  AlertCircle,
  LogOut,
  Settings,
  Bell,
  RefreshCw,
  Camera,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GUARANTOR_BANNER_DISMISS_KEY = "taja_logistics_guarantor_banner_dismissed";

export default function LogisticsDashboardPage() {
  const { logout } = useAuth();
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

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState<{
    type: "email" | "job";
    jobId?: string;
    stage?: "pickup" | "delivery";
  } | null>(null);

  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [guarantorBannerDismissed, setGuarantorBannerDismissed] = useState(false);
  const [headerRefreshing, setHeaderRefreshing] = useState(false);

  const guarantorRelationshipReject = useMemo(
    () => getGuarantorRelationshipRejection(guarantor.relationship),
    [guarantor.relationship]
  );

  const refreshDashboardQuiet = async () => {
    try {
      setHeaderRefreshing(true);
      await Promise.all([loadNearbyJobs(), loadActiveJobs()]);
      const me = await api("/api/logistics/me");
      setProfile(me?.data || null);
    } catch {
      toast.error("Could not refresh");
    } finally {
      setHeaderRefreshing(false);
    }
  };

  const signOutRider = async () => {
    try {
      await logout();
    } finally {
      window.location.assign("/logistics/login");
    }
  };

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
        toast.success("Password updated — sign in again with your new password");
        setPwdCurrent("");
        setPwdNew("");
        setShowSettings(false);
        await logout();
        window.location.assign("/logistics/login?passwordUpdated=1");
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
    const relReject = getGuarantorRelationshipRejection(guarantor.relationship);
    if (relReject) {
      toast.error(relReject);
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
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(GUARANTOR_BANNER_DISMISS_KEY);
        }
        setGuarantorBannerDismissed(false);
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

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    setGuarantorBannerDismissed(sessionStorage.getItem(GUARANTOR_BANNER_DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (profile && !profile.requiresGuarantorForm && typeof window !== "undefined") {
      sessionStorage.removeItem(GUARANTOR_BANNER_DISMISS_KEY);
      setGuarantorBannerDismissed(false);
    }
  }, [profile?.requiresGuarantorForm]);

  const showGuarantorTopBanner =
    Boolean(profile?.requiresGuarantorForm) && !guarantorBannerDismissed;

  const dismissGuarantorBanner = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(GUARANTOR_BANNER_DISMISS_KEY, "1");
    }
    setGuarantorBannerDismissed(true);
  };

  const scrollToGuarantorForm = () => {
    document.getElementById("guarantor-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    setOtpTarget({ type: "job", jobId, stage });
    setOtpModalOpen(true);
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
    setOtpTarget({ type: "email" });
    setOtpModalOpen(true);
  };

  const handleOtpVerify = async (code: string) => {
    if (otpTarget?.type === "email") {
      const res = await api("/api/logistics/otp/verify", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      if (res?.success) {
        toast.success("Email OTP verified");
        await load();
      } else {
        throw new Error(res?.message || "Failed to verify OTP");
      }
    } else if (otpTarget?.type === "job" && otpTarget.jobId) {
      setActingJobId(otpTarget.jobId);
      try {
        const res = await api(`/api/logistics/jobs/${otpTarget.jobId}/otp/verify`, {
          method: "POST",
          body: JSON.stringify({ code: code.trim(), stage: otpTarget.stage }),
        });
        if (res?.success) {
          toast.success(`${otpTarget.stage} OTP verified`);
          await loadActiveJobs();
        } else {
          throw new Error(res?.message || "OTP verification failed");
        }
      } finally {
        setActingJobId(null);
      }
    }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color = "emerald" }: { icon: any, label: string, value: string | number, subtext?: string, color?: string }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 flex flex-col justify-between hover:shadow-premium transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
          color === "emerald" ? "bg-emerald-50 text-emerald-600" : 
          color === "blue" ? "bg-blue-50 text-blue-600" : 
          "bg-slate-50 text-slate-600"
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex -space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-100" />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        {subtext && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="logistics" redirectTo="/logistics/login">
      <div className="min-h-screen bg-white">
        {/* ═══ Desktop Sidebar / Mobile Nav ═══ */}
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative">
          
          <aside className="w-full lg:w-80 lg:h-screen lg:sticky lg:top-0 p-6 lg:p-8 border-r border-slate-50 flex flex-col z-20">
            <div className="mb-10 flex items-center justify-between lg:block">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tighter italic">Logistics.</h1>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest lg:ml-1">Partner Console</p>
            </div>

            <nav className="flex-1 space-y-2">
              <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10">
                <Activity className="h-4 w-4" />
                Dashboard
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-transparent text-slate-500 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Settings className={cn("h-4 w-4 transition-transform", showSettings && "rotate-90")} />
                Security
              </button>
              <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-transparent text-slate-500 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest transition-all">
                <Bell className="h-4 w-4" />
                Alerts
              </button>
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-50">
              {profile && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-3xl bg-slate-50">
                    <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400">
                      {profile.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{profile.fullName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Rider</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void signOutRider()}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 p-6 lg:p-12 space-y-12">
            <AnimatePresence>
              {showGuarantorTopBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="sticky top-0 z-30 -mx-2 sm:mx-0"
                >
                  <div
                    role="region"
                    aria-label="Guarantor form required"
                    className="rounded-2xl sm:rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50/80 shadow-[0_12px_40px_-16px_rgba(180,83,9,0.35)] px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="shrink-0 h-10 w-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-amber-700" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800/90">
                          Action needed — trust &amp; payouts
                        </p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                          Complete your guarantor details to unlock higher-value routes and faster payout eligibility.
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          You can dismiss this for now; it will show again next time you open the portal until this step is done.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:pl-2">
                      <Button
                        type="button"
                        onClick={scrollToGuarantorForm}
                        className="h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px] tracking-widest px-5"
                      >
                        Complete form
                      </Button>
                      <button
                        type="button"
                        onClick={dismissGuarantorBanner}
                        className="h-11 w-11 rounded-xl border border-amber-200/80 bg-white/80 text-slate-500 hover:text-slate-900 hover:bg-white flex items-center justify-center transition-colors"
                        aria-label="Dismiss banner for this session"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ Top Header / Status ═══ */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-3">
                  <Zap className="h-3 w-3" />
                  Live Operational Network
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Welcome back, Partner.</h2>
                <p className="text-sm font-semibold text-slate-400 mt-1">Nigeria's premium dispatch engine is synchronized.</p>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={toggleOnline} 
                  disabled={saving}
                  className={cn(
                    "h-14 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-[0.98]",
                    profile?.availability?.isOnline 
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" 
                      : "bg-white border border-slate-200 text-slate-400"
                  )}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profile?.availability?.isOnline ? (
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live & Online
                    </span>
                  ) : (
                    "Switch Online"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-14 p-0 rounded-2xl border-slate-200"
                  onClick={() => void refreshDashboardQuiet()}
                  disabled={headerRefreshing || jobsLoading || activeJobsLoading}
                  aria-label="Refresh dashboard"
                >
                  <RefreshCw className={cn("h-5 w-5 text-slate-400", headerRefreshing && "animate-spin")} />
                </Button>
              </div>
            </header>

            <AnimatePresence>
              {showSettings && (
                <motion.section 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-950 rounded-[3rem] p-8 sm:p-10 text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                    <ShieldCheck className="h-40 w-40" />
                  </div>
                  <div className="relative z-10 max-w-lg">
                    <h3 className="text-2xl font-black tracking-tight italic mb-2 text-emerald-400">Security Credentials</h3>
                    <p className="text-sm font-medium text-slate-400 mb-8 uppercase tracking-widest">Update your portal access keys.</p>
                    
                    <form onSubmit={changePassword} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Current Key</Label>
                          <Input
                            type="password"
                            value={pwdCurrent}
                            onChange={(e) => setPwdCurrent(e.target.value)}
                            required
                            className="h-12 rounded-xl bg-white/5 border-white/10 text-white focus:ring-emerald-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Key</Label>
                          <Input
                            type="password"
                            value={pwdNew}
                            onChange={(e) => setPwdNew(e.target.value)}
                            required
                            minLength={6}
                            className="h-12 rounded-xl bg-white/5 border-white/10 text-white focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={pwdSaving}
                        className="h-12 px-8 rounded-xl bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all"
                      >
                        {pwdSaving ? "Synchronizing…" : "Authorize Key Reset"}
                      </Button>
                    </form>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-48 rounded-[2.5rem] bg-slate-50 border border-slate-100" />
                ))}
              </div>
            ) : profile && (
              <section className="space-y-8">
                {/* ═══ Main Stats Grid ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={TrendingUp}
                    label="Performance Rating"
                    value={`${profile.assignment?.averageRating || 0}/5.0`}
                    subtext="Elite Partner Status"
                    color="emerald"
                  />
                  <StatCard 
                    icon={CheckCircle2}
                    label="Jobs Completed"
                    value={profile.assignment?.totalCompleted || 0}
                    subtext={`of ${profile.assignment?.totalAssigned || 0} assigned`}
                    color="blue"
                  />
                  <StatCard 
                    icon={Award}
                    label="Trust Tier"
                    value={`Tier ${profile.trust?.trustTier ?? 0}`}
                    subtext={profile.trust?.kycStatus || "pending"}
                    color="slate"
                  />
                  <StatCard 
                    icon={Zap}
                    label="Earnings Cap"
                    value={`₦${((profile.assignment?.maxOrderValueKobo || 0) / 100).toLocaleString()}`}
                    subtext="Max per assignment"
                    color="emerald"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* ═══ Assignment Capability & KYC ═══ */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Active Jobs Section */}
                    {profile.eligibleForAssignment && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-1 w-8 bg-blue-500 rounded-full" />
                            <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Operational Tasks</h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                            {activeJobs.length} Active
                          </span>
                        </div>

                        {activeJobsLoading ? (
                          <div className="p-12 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-100">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400 mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing local jobs...</p>
                          </div>
                        ) : activeJobs.length === 0 ? (
                          <div className="p-16 text-center bg-slate-50/30 rounded-[3rem] border border-dashed border-slate-100">
                            <Smartphone className="h-8 w-8 mx-auto text-slate-200 mb-3" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No active assignments</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {activeJobs.map((job) => (
                              <div key={job._id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 hover:shadow-premium transition-all overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                  <Truck className="h-32 w-32" />
                                </div>
                                <div className="relative z-10">
                                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <div>
                                      <span className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                        job.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                      )}>
                                        {job.status.replace("_", " ")}
                                      </span>
                                      <p className="text-xs font-black text-slate-900 mt-2">ASSIGNMENT #{job._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Value</p>
                                      <p className="text-lg font-black text-slate-900 tracking-tight">₦{(job.valueKobo / 100).toLocaleString()}</p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <div className="flex items-start gap-3">
                                      <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup Location</p>
                                        <p className="text-xs font-bold text-slate-700">{job.pickup?.address}, {job.pickup?.city}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <Truck className="h-4 w-4 text-emerald-500" />
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                                        <p className="text-xs font-bold text-slate-700">{job.dropoff?.address}, {job.dropoff?.city}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-50">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <Button
                                        onClick={() => verifyJobOtp(job._id, "pickup")}
                                        disabled={actingJobId === job._id || !!job.otp?.pickupVerifiedAt}
                                        className={cn(
                                          "h-12 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                          job.otp?.pickupVerifiedAt ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-900"
                                        )}
                                      >
                                        {job.otp?.pickupVerifiedAt ? "Pickup Verified" : "Verify Pickup"}
                                      </Button>
                                      <Button
                                        onClick={() => uploadJobProof(job._id, "pickup")}
                                        disabled={actingJobId === job._id}
                                        variant="outline"
                                        className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-200"
                                      >
                                        <Camera className="h-4 w-4 mr-2" />
                                        Proof
                                      </Button>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <Button
                                        onClick={() => verifyJobOtp(job._id, "delivery")}
                                        disabled={actingJobId === job._id || !job.otp?.pickupVerifiedAt || !!job.otp?.deliveryVerifiedAt}
                                        className={cn(
                                          "h-12 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                          job.otp?.deliveryVerifiedAt ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-emerald-500"
                                        )}
                                      >
                                        {job.otp?.deliveryVerifiedAt ? "Delivered" : "Verify Dropoff"}
                                      </Button>
                                      <Button
                                        onClick={() => uploadJobProof(job._id, "delivery")}
                                        disabled={actingJobId === job._id || !job.otp?.pickupVerifiedAt}
                                        variant="outline"
                                        className="h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-200"
                                      >
                                        <Camera className="h-4 w-4 mr-2" />
                                        Proof
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nearby Jobs Section */}
                    {profile.eligibleForAssignment && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                            <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Live Broadcasts</h3>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadNearbyJobs}
                            className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                          >
                            <RefreshCw className={cn("h-3 w-3 mr-1.5", jobsLoading && "animate-spin")} />
                            Refresh Queue
                          </Button>
                        </div>

                        {jobsLoading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[...Array(2)].map((_, i) => (
                              <div key={i} className="h-40 rounded-[2rem] bg-slate-50 border border-slate-100 animate-pulse" />
                            ))}
                          </div>
                        ) : jobs.length === 0 ? (
                          <div className="p-16 text-center bg-slate-50/20 rounded-[3rem] border border-dashed border-slate-100">
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Scanning for new broadcasts...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {jobs.map((job) => (
                              <div key={job._id} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between hover:border-emerald-200 transition-all group">
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                      <Zap className="h-3 w-3 fill-emerald-600" />
                                      Ready to Claim
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-bold">
                                        {job.broadcast?.expiresAt ? new Date(job.broadcast.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "∞"}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-lg font-black text-slate-900 tracking-tight mb-3">₦{(job.valueKobo / 100).toLocaleString()}</p>
                                  <div className="space-y-1 mb-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                      <MapPin className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                      <span className="truncate">{job.pickup?.city} → {job.dropoff?.city}</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => claimJob(job._id)}
                                  disabled={claimingJobId === job._id}
                                  className="w-full h-11 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all group-hover:bg-emerald-500"
                                >
                                  {claimingJobId === job._id ? "Claiming..." : "Accept Job"}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ═══ Right Rail: Identity & Actions ═══ */}
                  <div className="space-y-8">
                    
                    {/* Identity Card */}
                    <div className="bg-slate-950 rounded-[3rem] p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <UserCheck className="h-32 w-32" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6">Network Identity</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                            <span className="text-xs font-black text-emerald-400 uppercase italic">{profile.status.replace("_", " ")}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coverage</span>
                            <span className="text-xs font-black text-white uppercase">{profile.coverage?.city}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email OTP</span>
                            <span className={cn("text-xs font-black uppercase italic", profile.emailOtpVerified ? "text-emerald-400" : "text-amber-400")}>
                              {profile.emailOtpVerified ? "Verified" : "Pending"}
                            </span>
                          </div>
                        </div>

                        {!profile.emailOtpVerified && (
                          <div className="mt-8 grid grid-cols-2 gap-2">
                            <Button onClick={sendOtp} className="h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest">
                              Send OTP
                            </Button>
                            <Button onClick={verifyOtp} className="h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[9px] font-black uppercase tracking-widest">
                              Verify
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Guarantor Call-to-action */}
                    {profile.requiresGuarantorForm && (
                      <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100/50">
                        <AlertCircle className="h-8 w-8 text-amber-600 mb-4" />
                        <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-2">Final Trust Check Required</h4>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6">Complete your guarantor details to unlock high-value assignments and daily payouts.</p>
                        <Button asChild className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[10px] tracking-widest">
                          <a href="#guarantor-form">Complete Now</a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ═══ Guarantor Form (Cinematic Overlay/Section) ═══ */}
            {profile?.requiresGuarantorForm && (
              <section id="guarantor-form" className="bg-slate-50 rounded-[3rem] p-8 sm:p-12 border border-slate-200">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200">
                      <ShieldCheck className="h-6 w-6 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight italic">Guarantor Submission</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Trust Approval Protocol</p>
                    </div>
                  </div>

                  <div className="mb-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 sm:px-5 sm:py-4">
                    <p className="text-xs font-semibold text-amber-950/90 leading-relaxed">{GUARANTOR_RELATIONSHIP_DISCLAIMER}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                        <Input 
                          value={guarantor.fullName} 
                          onChange={(e) => setGuarantor((p) => ({ ...p, fullName: e.target.value }))}
                          className="h-12 rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</Label>
                        <Input 
                          value={guarantor.phone} 
                          onChange={(e) => setGuarantor((p) => ({ ...p, phone: e.target.value }))}
                          className="h-12 rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guarantor-relationship" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                          Relationship to you
                        </Label>
                        <Input
                          id="guarantor-relationship"
                          value={guarantor.relationship}
                          onChange={(e) => setGuarantor((p) => ({ ...p, relationship: e.target.value }))}
                          placeholder="e.g. Employer — HR Manager, Landlord, Pastor at …"
                          autoComplete="off"
                          aria-invalid={guarantorRelationshipReject ? true : undefined}
                          className={cn(
                            "h-12 rounded-xl border-slate-200 bg-white",
                            guarantorRelationshipReject && "border-amber-500 ring-2 ring-amber-500/25"
                          )}
                        />
                        {guarantorRelationshipReject ? (
                          <p className="text-xs font-bold text-amber-700 leading-snug" role="alert">
                            {guarantorRelationshipReject}
                          </p>
                        ) : (
                          <p className="text-[11px] font-medium text-slate-500 leading-snug">
                            Describe how they know you professionally or as a formal referee—not a spouse or partner.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Type</Label>
                        <select
                          value={guarantor.idType}
                          onChange={(e) => setGuarantor((p) => ({ ...p, idType: e.target.value }))}
                          className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold appearance-none"
                        >
                          <option value="national_id">National ID Card</option>
                          <option value="drivers_license">Driver&apos;s License</option>
                          <option value="passport">International Passport</option>
                          <option value="voters_card">Voter&apos;s Card</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Residence Address</Label>
                        <Textarea 
                          rows={4} 
                          value={guarantor.address} 
                          onChange={(e) => setGuarantor((p) => ({ ...p, address: e.target.value }))}
                          className="rounded-2xl border-slate-200 bg-white"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Live Selfie</Label>
                          <div className="relative group">
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => uploadGuarantorImage(e.target.files?.[0], "selfieImage")}
                              className="hidden"
                              id="g-selfie"
                            />
                            <label 
                              htmlFor="g-selfie"
                              className={cn(
                                "h-24 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-all",
                                guarantor.selfieImage && "border-emerald-500 bg-emerald-50"
                              )}
                            >
                              {uploadingGuarantorSelfie ? (
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                              ) : guarantor.selfieImage ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              ) : (
                                <>
                                  <Camera className="h-6 w-6 text-slate-300" />
                                  <span className="text-[8px] font-black uppercase text-slate-400 mt-2">Upload</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Document</Label>
                          <div className="relative group">
                            <Input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => uploadGuarantorImage(e.target.files?.[0], "idFrontImage")}
                              className="hidden"
                              id="g-id"
                            />
                            <label 
                              htmlFor="g-id"
                              className={cn(
                                "h-24 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-all",
                                guarantor.idFrontImage && "border-emerald-500 bg-emerald-50"
                              )}
                            >
                              {uploadingGuarantorId ? (
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                              ) : guarantor.idFrontImage ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              ) : (
                                <>
                                  <ShieldCheck className="h-6 w-6 text-slate-300" />
                                  <span className="text-[8px] font-black uppercase text-slate-400 mt-2">Upload</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 italic max-w-xs uppercase leading-relaxed">
                      By submitting, you authorize Taja to verify guarantor details for fleet security protocols.
                    </p>
                    <Button
                      onClick={submitGuarantor}
                      disabled={
                        submittingGuarantor ||
                        uploadingGuarantorId ||
                        uploadingGuarantorSelfie ||
                        Boolean(guarantorRelationshipReject)
                      }
                      title={guarantorRelationshipReject || undefined}
                      className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.25em] shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {submittingGuarantor ? "Processing..." : "Submit Profile for Approval"}
                    </Button>
                  </div>
                </div>
              </section>
            )}
            <OTPModal
                isOpen={otpModalOpen}
                onClose={() => setOtpModalOpen(false)}
                onVerify={handleOtpVerify}
                onResend={otpTarget?.type === "email" ? sendOtp : undefined}
                email={otpTarget?.type === "email" ? profile?.fullName : undefined}
                title={otpTarget?.type === "job" ? `${otpTarget.stage === 'pickup' ? 'Pickup' : 'Delivery'} Verification` : undefined}
                description={otpTarget?.type === "job" ? `Enter the 6-digit code provided by the ${otpTarget.stage === 'pickup' ? 'sender' : 'recipient'}.` : undefined}
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
