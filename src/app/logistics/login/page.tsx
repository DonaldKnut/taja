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
      <div className="hidden lg:flex flex-1 relative items-center justify-center h-screen sticky top-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #020c07 0%, #041a0e 40%, #061508 70%, #020a05 100%)" }}>

        {/* ── SVG Map-Grid Background ── */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="logistics-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#34d399" strokeWidth="0.5"/>
            </pattern>
            <pattern id="dot-grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1" fill="#34d399" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#logistics-grid)" />
          <rect width="100%" height="100%" fill="url(#dot-grid)" opacity="0.4" />
        </svg>

        {/* ── Ambient glows ── */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.12, 0.28, 0.12], scale: [1, 1.15, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-[480px] h-[480px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)", filter: "blur(60px)" }}
          />
          <motion.div
            animate={{ opacity: [0.06, 0.16, 0.06], scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(251,146,60,0.25) 0%, transparent 70%)", filter: "blur(80px)" }}
          />
        </div>

        {/* ── Speed-streak lines ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { top: "18%", dur: 2.4, delay: 0,   width: "w-48", color: "via-emerald-400" },
            { top: "32%", dur: 3.1, delay: 0.7, width: "w-32", color: "via-orange-400" },
            { top: "48%", dur: 2.0, delay: 1.2, width: "w-56", color: "via-emerald-300" },
            { top: "63%", dur: 3.5, delay: 0.4, width: "w-40", color: "via-amber-400" },
            { top: "76%", dur: 2.8, delay: 1.8, width: "w-36", color: "via-emerald-500" },
            { top: "88%", dur: 1.9, delay: 0.9, width: "w-24", color: "via-orange-300" },
          ].map((s, i) => (
            <motion.div
              key={i}
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: s.dur, repeat: Infinity, ease: "linear", delay: s.delay }}
              className={`h-px ${s.width} bg-gradient-to-r from-transparent ${s.color} to-transparent absolute opacity-30`}
              style={{ top: s.top }}
            />
          ))}
        </div>

        {/* ── Route node dots ── */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { top: "15%", left: "12%", size: "h-2 w-2", color: "bg-emerald-400", pulse: true },
            { top: "42%", left: "80%", size: "h-3 w-3", color: "bg-orange-400", pulse: true },
            { top: "68%", left: "20%", size: "h-2 w-2", color: "bg-emerald-300", pulse: false },
            { top: "82%", left: "72%", size: "h-2 w-2", color: "bg-amber-400", pulse: true },
            { top: "28%", left: "55%", size: "h-1.5 w-1.5", color: "bg-emerald-500", pulse: false },
          ].map((dot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: dot.pulse ? [0.8, 1.3, 0.8] : 1 }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
              className={`absolute ${dot.size} rounded-full ${dot.color}`}
              style={{ top: dot.top, left: dot.left }}
            />
          ))}
        </div>

        {/* ── Main Content ── */}
        <div className="relative z-10 w-full max-w-[420px] px-10 space-y-10">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em]">Live Network · Lagos &amp; Beyond</span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-8 bg-gradient-to-r from-emerald-400 to-orange-400 rounded-full" />
              <div className="h-0.5 w-3 bg-emerald-400/30 rounded-full" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-[1.05] italic" style={{ color: "#f0fdf4" }}>
              Drive the
              <br />
              <span style={{ background: "linear-gradient(90deg, #34d399, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Future.
              </span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#4ade80", opacity: 0.7 }}>
              Nigeria's #1 Logistics Engine
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { value: "500+", label: "Elite Partners", accent: "#34d399" },
              { value: "98%", label: "On-Time Rate", accent: "#fb923c" },
              { value: "24/7", label: "Live Support", accent: "#34d399" },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl p-3 text-center border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}>
                <p className="text-xl font-black tracking-tighter" style={{ color: stat.accent }}>{stat.value}</p>
                <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-3">
            {[
              {
                title: "Fast Payouts",
                desc: "Earnings deposited daily, direct to your account.",
                icon: Zap,
                accent: "#34d399",
                bgAccent: "rgba(52,211,153,0.08)",
                borderAccent: "rgba(52,211,153,0.15)",
                delay: 0.45,
              },
              {
                title: "Smart Routes",
                desc: "AI-optimized navigation for every delivery.",
                icon: MapPin,
                accent: "#fb923c",
                bgAccent: "rgba(251,146,60,0.08)",
                borderAccent: "rgba(251,146,60,0.15)",
                delay: 0.55,
              },
              {
                title: "Elite Fleet",
                desc: "Premium tools, training & 24/7 rider support.",
                icon: ShieldCheck,
                accent: "#60a5fa",
                bgAccent: "rgba(96,165,250,0.08)",
                borderAccent: "rgba(96,165,250,0.15)",
                delay: 0.65,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.delay, type: "spring", stiffness: 120 }}
                className="flex items-center gap-4 p-4 rounded-2xl group cursor-default transition-all duration-300 hover:scale-[1.02]"
                style={{ background: item.bgAccent, border: `1px solid ${item.borderAccent}`, backdropFilter: "blur(10px)" }}
              >
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-300"
                  style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30` }}>
                  <item.icon className="h-4.5 w-4.5" style={{ color: item.accent, height: "1.1rem", width: "1.1rem" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#f0fdf4" }}>{item.title}</h4>
                  <p className="text-[9px] font-medium leading-tight" style={{ color: "rgba(255,255,255,0.38)" }}>{item.desc}</p>
                </div>
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: item.accent }} />
              </motion.div>
            ))}
          </div>

          {/* Partner avatars footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-5 pt-6 border-t"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex -space-x-3">
              {[
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/dele_mup0gl.png",
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/LYNNPINNEDIT___mv5yne.jpg",
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/Portrait____Cooperate_headshot_qfzmsr.jpg",
              ].map((src, i) => (
                <div key={i} className="h-9 w-9 rounded-full overflow-hidden shadow-2xl"
                  style={{ border: "2px solid #020c07", ring: "1px solid rgba(255,255,255,0.15)" }}>
                  <img src={src} alt="Partner" className="h-full w-full object-cover" />
                </div>
              ))}
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-[8px] font-black shadow-xl"
                style={{ background: "rgba(52,211,153,0.15)", border: "2px solid #020c07", color: "#34d399" }}>
                +497
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: "#f0fdf4" }}>Join 500+ Elite Partners</p>
              <p className="text-[8px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Earning daily across Nigeria</p>
            </div>
          </motion.div>
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
