"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Phone, ShoppingBag, Store, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { normalizeNigerianPhone, isValidNigerianPhone } from "@/lib/utils";
import type { UserRole } from "@/types";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const redirect = searchParams.get("redirect") || "/dashboard";

  // Redirect logic
  useEffect(() => {
    if (!user) {
      refreshUser().finally(() => setChecking(false));
      return;
    }

    // Determine final redirect path
    let finalRedirect = redirect;
    if (finalRedirect) {
      finalRedirect = decodeURIComponent(finalRedirect);
      if (!finalRedirect.startsWith("/")) finalRedirect = "/" + finalRedirect;
      if (finalRedirect.startsWith("/auth/")) finalRedirect = finalRedirect.replace("/auth/", "/");
    }

    const hasPhone = user.phone && String(user.phone).trim() !== "";
    if (hasPhone) {
      if (user.roleSelected && user.role) {
        if (!finalRedirect || finalRedirect === "/" || finalRedirect === "/dashboard" || finalRedirect === "/seller/dashboard") {
          finalRedirect = user.role === "seller" ? "/seller/dashboard" : "/dashboard";
        }
        router.replace(finalRedirect);
        return;
      }
      router.replace(`/onboarding/role-selection?redirect=${encodeURIComponent(finalRedirect)}`);
      return;
    }
    setFullName(user.fullName || "");
    setChecking(false);
  }, [user, redirect, router, refreshUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!fullName || fullName.trim().length < 2) {
      setErrors({ fullName: "Please enter your full name" });
      toast.error("Please enter your full name");
      return;
    }
    if (!phone || phone.trim() === "") {
      setErrors({ phone: "Please enter your phone number" });
      toast.error("Please enter your phone number");
      return;
    }
    const normalizedPhone = normalizeNigerianPhone(phone);
    if (!isValidNigerianPhone(phone)) {
      setErrors({ phone: "Please enter a valid Nigerian phone number" });
      toast.error("Please enter a valid Nigerian phone number (e.g. 08012345678 or +234 801 234 5678)");
      return;
    }

    setLoading(true);
    try {
      await api("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: normalizedPhone,
        }),
      });
      if (typeof window !== "undefined") {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          u.fullName = fullName.trim();
          u.phone = normalizedPhone;
          localStorage.setItem("user", JSON.stringify(u));
        }
      }
      await refreshUser();
      toast.success("Profile details saved!");
      router.push(`/onboarding/role-selection?redirect=${encodeURIComponent(redirect)}`);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Logo className="mx-auto mb-6 scale-110" />
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight">
            Let's get to know you
          </h1>
          <p className="text-gray-500 text-sm sm:text-base font-medium max-w-sm mx-auto">
            Just a few final details to set up your Taja.Shop account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-8 rounded-[32px] shadow-premium-hover">
          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 px-1">
                Full name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
                  }}
                  className="pl-12 h-14 rounded-2xl border-gray-100 bg-white/50 focus:bg-white focus:border-taja-primary transition-all text-base font-medium"
                  placeholder="e.g. Chinedu Okeke"
                  disabled={loading}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-500 font-bold px-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 px-1">
                Phone number <span className="text-taja-primary">*</span>
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  className="pl-12 h-14 rounded-2xl border-gray-100 bg-white/50 focus:bg-white focus:border-taja-primary transition-all text-base font-medium"
                  placeholder="0801 234 5678"
                  disabled={loading}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-500 font-bold px-1">{errors.phone}</p>
              )}
              <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                For order updates and security
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="gradient"
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[11px] shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving details…
              </>
            ) : (
              <>
                Continue to role selection
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-8">
          Taja Tech Innovations Limited
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
