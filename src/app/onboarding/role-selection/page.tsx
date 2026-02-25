"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Store, ArrowRight, CheckCircle, Sparkles, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function RoleSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { user, refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  // If user already chose role at register, skip this page
  useEffect(() => {
    if (!user) return;
    if (user.roleSelected && user.role) {
      if (user.role === "seller") router.replace("/seller/dashboard");
      else router.replace(redirect || "/dashboard");
    }
  }, [user, redirect, router]);

  const handleRoleSelection = async (role: "buyer" | "seller", skipKyc = false) => {
    try {
      if (skipKyc) setSkipLoading(true);
      else setLoading(true);
      setSelectedRole(role);

      const response = await api("/api/users/select-role", {
        method: "POST",
        body: JSON.stringify({ role }),
      });

      if (response?.success) {
        await refreshUser();
        toast.success(skipKyc ? "Explore the platform—you can complete verification anytime." : `Welcome as a ${role === "seller" ? "seller" : "buyer"}!`);

        if (role === "seller") {
          if (skipKyc) router.push("/seller/dashboard");
          else router.push("/onboarding/kyc");
        } else {
          router.push(redirect || "/dashboard");
        }
      } else {
        toast.error(response?.message || "Failed to select role");
        setSelectedRole(null);
      }
    } catch (error: any) {
      console.error("Role selection error:", error);
      toast.error(error?.message || "Failed to select role");
      setSelectedRole(null);
    } finally {
      setLoading(false);
      setSkipLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-taja-primary/30 flex flex-col relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-taja-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-motif-blanc opacity-40" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-white/60 bg-white/40 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6">
          <Logo size="lg" variant="header" />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-6 py-16 sm:py-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-5xl w-full"
        >
          <motion.div variants={item} className="text-center mb-16 sm:mb-20">
            <h1 className="text-4xl sm:text-6xl font-black text-taja-secondary mb-6 tracking-tighter leading-tight uppercase italic">
              Choose Your <span className="text-taja-primary">Role</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium">
              Join the platform as a shopper or a seller. Your journey on <span className="text-taja-primary font-bold">Taja.Shop</span> begins here.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {/* Buyer Option */}
            <motion.div
              variants={item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative glass-panel rounded-[40px] p-8 sm:p-12 cursor-pointer transition-all duration-500 border-2 overflow-hidden ${selectedRole === "buyer"
                ? "border-taja-primary bg-white shadow-premium ring-4 ring-taja-primary/10"
                : "border-white/60 bg-white/40 hover:bg-white hover:border-taja-primary/40 hover:shadow-2xl"
                }`}
              onClick={() => !loading && handleRoleSelection("buyer")}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${selectedRole === "buyer" ? "bg-taja-primary text-white shadow-emerald" : "bg-emerald-50 text-taja-primary"
                  }`}>
                  <ShoppingBag className="h-10 w-10" />
                </div>

                <h2 className="text-3xl font-black text-taja-secondary mb-4 tracking-tight uppercase">
                  Shopper
                </h2>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                  Browse verified sellers, discover unique finds, and enjoy a seamless checkout and tracking experience.
                </p>

                <div className="w-full space-y-4 mb-10 text-left">
                  {[
                    "Verified Seller Network",
                    "Secure Instant Payments",
                    "Real-time Order Tracking",
                    "Smart Search Engine"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${selectedRole === "buyer" ? "bg-taja-primary/20 text-taja-primary" : "bg-gray-100 text-gray-400"
                        }`}>
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={selectedRole === "buyer" ? "gradient" : "outline"}
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-sm group-hover:shadow-md"
                  disabled={loading}
                >
                  {loading && selectedRole === "buyer" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Shopping"}
                </Button>
              </div>
            </motion.div>

            {/* Seller Option */}
            <motion.div
              variants={item}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative glass-panel rounded-[40px] p-8 sm:p-12 cursor-pointer transition-all duration-500 border-2 overflow-hidden ${selectedRole === "seller"
                ? "border-taja-primary bg-white shadow-premium ring-4 ring-taja-primary/10"
                : "border-white/60 bg-white/40 hover:bg-white hover:border-taja-primary/40 hover:shadow-2xl"
                }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-taja-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-taja-primary/10 transition-colors" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${selectedRole === "seller" ? "bg-taja-primary text-white shadow-emerald" : "bg-taja-primary/10 text-taja-primary"
                  }`}>
                  <Store className="h-10 w-10" />
                </div>

                <h2 className="text-3xl font-black text-taja-secondary mb-4 tracking-tight uppercase">
                  Seller
                </h2>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                  Launch your online storefront, get AI-powered business insights, and reach active shoppers across the country.
                </p>

                <div className="w-full space-y-4 mb-10 text-left">
                  {[
                    "Smart Shop Dashboard",
                    "Advanced Shipping Hub",
                    "Automatic SEO Optimization",
                    "Market Performance Data"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${selectedRole === "seller" ? "bg-taja-primary/20 text-taja-primary" : "bg-gray-100 text-gray-400"
                        }`}>
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Button
                    variant={selectedRole === "seller" ? "gradient" : "outline"}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-sm group-hover:shadow-md"
                    disabled={loading || skipLoading}
                    onClick={(e) => { e.stopPropagation(); handleRoleSelection("seller", false); }}
                  >
                    {loading && selectedRole === "seller" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Launch Your Shop"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] border-white/60 text-gray-500 hover:text-taja-primary hover:border-taja-primary/40"
                    disabled={loading || skipLoading}
                    onClick={(e) => { e.stopPropagation(); handleRoleSelection("seller", true); }}
                  >
                    {skipLoading && selectedRole === "seller" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Compass className="h-4 w-4 mr-1.5" /> Skip for now — explore the platform</>}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={item} className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card border-white/60 bg-white/20">
              <Sparkles className="h-4 w-4 text-taja-primary animate-pulse" />
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                Setting up your workspace • Role can be adjusted in settings
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <Logo size="sm" />
      </div>
    </div>
  );
}
