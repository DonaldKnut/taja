"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Truck, Zap, ShieldCheck, Clock, ArrowRight, Mail, Lock, Eye, EyeOff, MapPin, Activity, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function LogisticsLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("passwordUpdated") === "1") {
      toast.success("Use your new password to sign in.", { duration: 6000 });
      if (typeof window !== "undefined" && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("passwordUpdated");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/logistics/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Sign-in failed");
      }
      const token = json?.data?.token;
      const user = json?.data?.user;
      if (token && user && typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        if (json.data.refreshToken) {
          localStorage.setItem("refreshToken", json.data.refreshToken);
        }
      }
      toast.success("Welcome back, Partner");
      const next = searchParams.get("redirect");
      const dest = next && next.startsWith("/logistics") ? next : "/logistics/dashboard";
      window.location.assign(dest);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative">
      {/* ═══ Background Decorative Elements ═══ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 motif-blanc opacity-20"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      {/* ═══ Left Side: Form (Scrollable) ═══ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md py-12">
          <div className="mb-12 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-10">
              <Logo size="lg" href="/" variant="header" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <Truck className="h-3 w-3" />
              Operational Gateway
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3 italic">
              Partner Entry.
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Authorized Logistics Personnel Only
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="rider-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="rider-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-emerald-500/20 transition-all text-sm font-bold"
                    placeholder="Enter partner email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rider-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="rider-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-emerald-500/20 transition-all text-sm font-bold"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-emerald-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                />
                Stay Signed In
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500"
              >
                Reset
              </Link>
            </div>

            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full h-15 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-[0.98] transition-all group bg-slate-900"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Launch Dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-16 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100/50 space-y-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              New to the fleet?
            </p>
            <p className="text-sm font-bold text-slate-600 leading-relaxed px-4">
              Join the high-performance delivery network powering Nigeria's finest stores.
            </p>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl border-slate-200 hover:bg-white hover:border-emerald-500 hover:text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] transition-all bg-white shadow-sm">
              <Link href="/logistics/apply">Apply to Join</Link>
            </Button>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
              <Activity className="h-3 w-3" /> Customer Portal
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Right Side: Promo Panel (Fixed) ═══ */}
      <div className="hidden lg:flex flex-1 relative bg-slate-950 items-center justify-center p-12 h-screen sticky top-0 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 motif-blanc opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-slate-950 to-blue-600/5"></div>
          
          {/* High-speed motion lines effect */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ x: [-1000, 1000] }}
                transition={{ duration: 2 + i, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                className="h-px w-64 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute"
                style={{ top: `${15 + (i * 15)}%`, left: '-20%' }}
              />
            ))}
          </div>

          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-12">
          <div className="space-y-4">
            <div className="h-1 w-10 bg-emerald-400 rounded-full" />
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight italic">
              Drive the <br />
              <span className="text-emerald-400 underline decoration-white/10 underline-offset-4">Future.</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
              Nigeria's #1 Logistics Engine
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Fast Payouts",
                desc: "Earnings delivered daily.",
                icon: Zap,
                color: "text-emerald-400"
              },
              {
                title: "Smart Routes",
                desc: "AI-optimized navigation.",
                icon: Activity,
                color: "text-blue-400"
              },
              {
                title: "Elite Fleet",
                desc: "Premium tools & support.",
                icon: ShieldCheck,
                color: "text-slate-300"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm group hover:bg-white/10 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">{item.title}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-10 border-t border-white/10">
            <div className="flex -space-x-3">
              {[
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/dele_mup0gl.png",
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/LYNNPINNEDIT___mv5yne.jpg",
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/Portrait____Cooperate_headshot_qfzmsr.jpg"
              ].map((src, i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden shadow-2xl ring-1 ring-white/20">
                  <img src={src} alt="Partner" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Join 500+ Elite Partners</p>
              <div className="flex items-center gap-1.5 opacity-60">
                <div className="h-1 w-1 rounded-full bg-emerald-400" />
                <div className="h-1 w-1 rounded-full bg-emerald-400" />
                <div className="h-1 w-1 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Securing Portal...</span>
          </div>
        </div>
      }
    >
      <LogisticsLoginForm />
    </Suspense>
  );
}
