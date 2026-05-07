"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

type LogisticsProfile = {
  _id: string;
  fullName: string;
  status: "pending_review" | "approved" | "rejected" | "suspended";
  trust?: { kycStatus?: "pending" | "verified" | "rejected" };
  availability?: { isOnline?: boolean; activeHours?: string };
  coverage?: { state?: string; city?: string; areas?: string[] };
  assignment?: { totalAssigned?: number; totalCompleted?: number; averageRating?: number };
  eligibleForAssignment?: boolean;
  emailOtpVerified?: boolean;
  payoutHoldActive?: boolean;
  payout?: { holdUntil?: string };
  risk?: { level?: "normal" | "watchlist" | "blacklist" };
};

export default function LogisticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<LogisticsProfile | null>(null);

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

  useEffect(() => {
    load();
  }, []);

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
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Logistics Dashboard</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Dispatch-ready profile with soft KYC and assignment eligibility checks.
            </p>
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
