"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Truck, Zap, ShieldCheck, Clock, ArrowRight, Mail, Lock, Eye, EyeOff, MapPin, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function LogisticsLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="min-h-screen bg-white overflow-hidden flex flex-col lg:flex-row relative">
      {/* ═══ Background Decorative Elements ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 motif-blanc opacity-20"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* ═══ Left Side: Form ═══ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-8">
              <Logo size="lg" href="/" variant="header" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <Truck className="h-3 w-3" />
              Logistics Portal
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">
              Partner Sign-in.
            </h1>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Access the Taja logistics engine.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rider-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
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
                    className="pl-12 h-13 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-emerald-500/20 transition-all text-sm font-semibold"
                    placeholder="partner@taja.shop"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rider-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Password</Label>
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
                    className="pl-12 pr-12 h-13 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-emerald-500/20 transition-all text-sm font-semibold"
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
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Forgot credentials?
              </Link>
            </div>

            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-[0.98] transition-all group"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in to Portal
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-12 p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
            <p className="text-xs font-semibold text-slate-500 leading-relaxed text-center">
              New to Taja Logistics? Join the fleet that powers Nigeria's premium marketplace.
            </p>
            <Button asChild variant="outline" className="w-full h-11 rounded-xl border-slate-200 hover:bg-white hover:border-emerald-500 hover:text-emerald-700 text-[10px] font-black uppercase tracking-widest transition-all">
              <Link href="/logistics/apply">Complete Rider Application</Link>
            </Button>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
              <ArrowRight className="h-3 w-3 rotate-180" /> Back to Customer Sign-in
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Right Side: Promo Panel ═══ */}
      <div className="hidden lg:flex flex-1 relative bg-slate-950 items-center justify-center p-12 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 motif-blanc opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-blue-600/10"></div>
          
          {/* Floating Blobs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -60, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-20 -left-20 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[140px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-lg space-y-12">
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.95] italic">
              Powering Nigeria's <br />
              <span className="text-emerald-400">Next-Day Delivery.</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed">
              Join the fleet that's redefining urban logistics for the modern African marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              {
                title: "Automated Payouts",
                desc: "Get paid instantly after every successful delivery cycle.",
                icon: Zap,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10 border-emerald-400/20"
              },
              {
                title: "Intelligent Routing",
                desc: "Optimized paths that save fuel and maximize your earnings.",
                icon: Activity,
                color: "text-blue-400",
                bg: "bg-blue-400/10 border-blue-400/20"
              },
              {
                title: "Premium Tech Support",
                desc: "24/7 dedicated assistance for all our logistics partners.",
                icon: ShieldCheck,
                color: "text-slate-300",
                bg: "bg-slate-400/10 border-slate-400/20"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className={cn(
                  "p-6 rounded-[2rem] border backdrop-blur-xl flex items-start gap-5 hover:-translate-y-1 transition-all group",
                  item.bg
                )}
              >
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3", item.bg, "bg-opacity-20")}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white tracking-tight uppercase mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-white/5">
            <div className="flex -space-x-3">
              {[
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/dele_mup0gl.png",
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/LYNNPINNEDIT___mv5yne.jpg",
                "https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/Portrait____Cooperate_headshot_qfzmsr.jpg"
              ].map((src, i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden shadow-xl ring-1 ring-white/10">
                  <img src={src} alt="Partner" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Trusted by 500+ Riders</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Zap key={i} className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" />)}
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
