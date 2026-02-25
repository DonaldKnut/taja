"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Gift,
  Users,
  Zap,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Share2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type ReferralMe = {
  referralCode: string;
  stats: {
    referredUsers: number;
    earned: { naira: number };
    pending: { naira: number };
  };
};

type ReferredUser = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
};

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralMe | null>(null);
  const [referredList, setReferredList] = useState<ReferredUser[]>([]);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  const referralLink = useMemo(() => {
    const code = data?.referralCode;
    if (!code) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;
  }, [data?.referralCode]);

  const load = async () => {
    setLoading(true);
    try {
      const [res, listRes] = await Promise.all([
        api("/api/referrals/me") as Promise<{ success?: boolean; data?: ReferralMe }>,
        api("/api/referrals/referred-users").catch(() => ({ success: false, data: [] })),
      ]);
      if (res?.success) setData(res.data ?? null);
      if ((listRes as any)?.success && Array.isArray((listRes as any).data)) setReferredList((listRes as any).data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Coordinate copied to clipboard");
    } catch {
      toast.error("Copy operation failed");
    }
  };

  const handleApply = async () => {
    const code = applyCode.trim().toUpperCase();
    if (!code) return toast.error("Coordinate required");
    setApplying(true);
    try {
      const res = await api("/api/referrals/apply", {
        method: "POST",
        body: JSON.stringify({ code }),
      }) as any;
      if (res?.success) {
        toast.success("Affiliation synchronized");
        setApplyCode("");
        await load();
      } else {
        toast.error(res?.message || "Sync failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Operation aborted");
    } finally {
      setApplying(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-10">
        {/* Cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black text-taja-secondary tracking-tighter">
                Referral <span className="text-taja-primary underline decoration-taja-primary/20 underline-offset-8">Program</span>
              </h1>
            </div>
            <p className="text-sm font-medium text-gray-500 tracking-wide flex items-center gap-2">
              Invite friends and earn rewards on every purchase
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border-white/60 shadow-premium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                    <div className="w-full h-full bg-gradient-to-br from-taja-primary/20 to-taja-secondary/20 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-taja-secondary">
                {data?.stats?.referredUsers || 0} Friends Referred
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Referral Link Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[3rem] p-10 border-white/60 shadow-premium relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl -z-10" />

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-taja-primary/10 flex items-center justify-center text-taja-primary shadow-inner">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-taja-secondary uppercase tracking-tight">Your Referral Link</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Invite friends to join Taja</p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-16 bg-gray-50 rounded-2xl w-full" />
                  <div className="h-10 bg-gray-50 rounded-full w-32" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 p-2 pl-6 bg-white/50 backdrop-blur-md border border-white/60 rounded-[2rem] shadow-inner group">
                    <div className="flex-1 py-4 text-xs font-bold text-taja-secondary truncate uppercase tracking-wide opacity-60">
                      {referralLink || "Generating your link..."}
                    </div>
                    <Button
                      className="rounded-[1.5rem] px-8 h-12 text-[10px] font-black uppercase tracking-widest shadow-emerald hover:shadow-emerald-hover transition-all"
                      onClick={() => copy(referralLink)}
                      disabled={!referralLink}
                    >
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Copy Link
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 pl-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Referral Code</span>
                      <span className="text-lg font-black text-taja-secondary tracking-widest font-mono">
                        {data?.referralCode || "---"}
                      </span>
                    </div>
                    <div className="h-10 w-px bg-gray-100 mx-4" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Status</span>
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-8 rounded-[2.5rem] border-white/60 shadow-premium"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-taja-secondary/5 flex items-center justify-center text-taja-secondary">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Friends Referred</p>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter">{data?.stats?.referredUsers ?? 0}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-8 rounded-[2.5rem] border-white/60 shadow-premium bg-taja-primary/5"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-taja-primary/10 flex items-center justify-center text-taja-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Liquid</div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-taja-primary mb-2">Total Earned</p>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter">{formatCurrency(data?.stats?.earned?.naira ?? 0)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-8 rounded-[2.5rem] border-white/60 shadow-premium"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Pending Rewards</p>
                <p className="text-3xl font-black text-taja-secondary tracking-tighter">{formatCurrency(data?.stats?.pending?.naira ?? 0)}</p>
              </motion.div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Apply Code Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[3rem] p-10 border-white/60 shadow-premium bg-white/50 backdrop-blur-xl"
            >
              <h2 className="text-xl font-black text-taja-secondary uppercase tracking-tight mb-2">Apply Referral Code</h2>
              <p className="text-[10px] font-medium text-gray-400 mb-8 leading-relaxed">Were you referred by a friend? Enter their referral code here to link your accounts.</p>

              <div className="space-y-4">
                <div className="relative group">
                  <Input
                    placeholder="Enter friend's code"
                    value={applyCode}
                    onChange={(e) => setApplyCode(e.target.value)}
                    className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white text-xs font-black uppercase tracking-[0.2em] px-6"
                  />
                </div>
                <Button
                  className="w-full h-14 rounded-2xl shadow-premium text-[11px] font-black uppercase tracking-[0.2em]"
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? "Processing..." : "Apply Code"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 text-center">Referral codes can only be applied once.</p>
              </div>
            </motion.div>

            {/* Program Info */}
            <div className="glass-panel p-8 rounded-[2.5rem] border-white/60">
              <h3 className="text-sm font-black text-taja-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-taja-primary" /> How it Works
              </h3>
              <ul className="space-y-4">
                {[
                  "Earn 2.5% on every completed purchase they make.",
                  "Rewards are available after the order is delivered.",
                  "Earned rewards are automatically added to your wallet.",
                  "There is no limit to how many friends you can invite."
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-taja-primary mt-1.5 shrink-0" />
                    <span className="text-[10px] font-medium text-gray-500 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Referred people list */}
            {referredList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel p-8 rounded-[2.5rem] border-white/60"
              >
                <h3 className="text-sm font-black text-taja-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-taja-primary" /> People you referred
                </h3>
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {referredList.map((u) => (
                    <li key={u._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-taja-secondary truncate">{u.fullName}</p>
                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{u.role}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

