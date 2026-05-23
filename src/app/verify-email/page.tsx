"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  LifeBuoy,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { api } from "@/lib/api";
import { normalizeNigerianPhone, isValidNigerianPhone } from "@/lib/utils";
import { getAuthErrorMessage } from "@/lib/auth-messages";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerification, refreshUser } = useAuth();
  const [step, setStep] = useState<"code" | "phone">("code");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [formData, setFormData] = useState({
    email: searchParams.get("email") || "",
    code: "",
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});

  const verifySchema = z.object({
    email: z.string().email({ message: "Enter a valid email" }),
    code: z
      .string()
      .min(6, { message: "Verification code must be 6 characters" }),
  });

  const isFormValid = verifySchema.safeParse(formData).success;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target as { name: "email" | "code" };
    const single = verifySchema.pick({ [name]: true } as any);
    const parsed = single.safeParse({ [name]: formData[name] } as any);
    if (!parsed.success) {
      setErrors({ ...errors, [name]: parsed.error.issues[0]?.message });
    } else {
      const next = { ...errors };
      delete next[name];
      setErrors(next);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = verifySchema.safeParse(formData);
    if (!parse.success) {
      const fieldErrors: { email?: string; code?: string } = {};
      parse.error.issues.forEach((issue) => {
        const path = issue.path[0] as "email" | "code";
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] || "Please fix the errors");
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const { needsPhone } = await verifyEmail(formData.email, formData.code);
      const redirect = searchParams.get("redirect") || "/dashboard";
      if (needsPhone) {
        setStep("phone");
      } else {
        router.push(redirect);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      toast.error("Please enter your email first");
      return;
    }

    const emailValid = z.string().email().safeParse(formData.email).success;
    if (!emailValid) {
      toast.error("Please enter a valid email");
      return;
    }

    setResending(true);
    try {
      await resendVerification(formData.email);
      setCountdown(30);
      toast.success("Verification code sent!");
    } catch (error: any) {
      console.error("Resend error:", error);
    } finally {
      setResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name as "email" | "code"]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeNigerianPhone(phoneInput.trim());
    if (!isValidNigerianPhone(normalized)) {
      setPhoneError("Enter a valid Nigerian phone number");
      return;
    }
    setPhoneError(undefined);
    setLoading(true);
    try {
      await api("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ phone: normalized }),
      });
      await refreshUser();
      toast.success("Phone number saved");
      router.push(searchParams.get("redirect") || "/dashboard");
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error?.message || "Could not save phone number"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const maskedEmail = formData.email
    ? formData.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "";

  const phoneNormalizedForValid =
    phoneInput.trim() ? normalizeNigerianPhone(phoneInput.trim()) : "";
  const phoneStepValid =
    phoneInput.trim().length > 0 && isValidNigerianPhone(phoneNormalizedForValid);

  return (
    <div className="h-screen bg-white overflow-hidden md:h-[100dvh] relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 motif-blanc opacity-40"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-taja-primary/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-taja-primary/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="grid h-full grid-cols-1 md:grid-cols-2 relative z-10">
        {/* Left — Form Panel */}
        <div className="flex items-center justify-center p-4 sm:p-8 md:p-12 h-full overflow-hidden">
          <div className="w-full max-w-md glass-card rounded-[2rem] border-white/40 shadow-premium max-h-full overflow-hidden flex flex-col">
            <div className="p-8 sm:p-10 overflow-y-auto scrollbar-hide flex-1">
              <div className="space-y-8">
                {/* Logo + Header */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-2">
                    <Logo size="lg" variant="header" />
                  </div>
                  <div className="w-14 h-14 bg-taja-light rounded-2xl flex items-center justify-center mx-auto">
                    {step === "code" ? (
                      <Mail className="h-7 w-7 text-taja-primary" />
                    ) : (
                      <Phone className="h-7 w-7 text-taja-primary" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">
                      {step === "code" ? "Check Your Inbox" : "Add your number"}
                    </h2>
                    <p className="text-xs font-medium text-gray-400 max-w-xs mx-auto leading-relaxed">
                      {step === "code" ? (
                        <>
                          We sent a 6-digit code to{" "}
                          {maskedEmail ? (
                            <span className="text-taja-primary font-bold">{maskedEmail}</span>
                          ) : (
                            "your email"
                          )}
                          . Enter it below to activate your account.
                        </>
                      ) : (
                        <>
                          Email verified. Add a Nigerian phone number for orders and account
                          recovery — same step as the Taja mobile app after signup.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {step === "code" ? (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="email" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${errors.email ? "border-red-300 focus:ring-red-200" : ""}`}
                          placeholder="john@example.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="code" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">
                        Verification Code
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                        </div>
                        <Input
                          id="code"
                          name="code"
                          type="text"
                          required
                          maxLength={6}
                          value={formData.code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 text-lg font-mono tracking-[0.4em] transition-all ${errors.code ? "border-red-300 focus:ring-red-200" : ""}`}
                          placeholder="000000"
                        />
                      </div>
                      {errors.code && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">
                          {errors.code}
                        </p>
                      )}
                    </div>

                    <div className="glass-card rounded-2xl border-gray-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-taja-secondary">
                            Didn't receive it?
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            Check spam or request a new code
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resending || countdown > 0}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-taja-primary/20 text-taja-primary bg-taja-light/30 hover:bg-taja-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {resending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-taja-primary/20 border-t-taja-primary" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          {countdown > 0 ? `${countdown}s` : "Resend"}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !isFormValid}
                      className="w-full h-11 rounded-2xl shadow-premium hover:shadow-premium-hover flex items-center justify-center gap-2 group transition-all"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                      ) : (
                        <>
                          <span className="font-black uppercase tracking-widest text-xs">
                            Verify & Continue
                          </span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handlePhoneSubmit}>
                    <div>
                      <label htmlFor="phone" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">
                        Phone number
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          value={phoneInput}
                          onChange={(e) => {
                            setPhoneInput(e.target.value);
                            if (phoneError) setPhoneError(undefined);
                          }}
                          className={`pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${phoneError ? "border-red-300 focus:ring-red-200" : ""}`}
                          placeholder="08012345678"
                        />
                      </div>
                      {phoneError && (
                        <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{phoneError}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !phoneStepValid}
                      className="w-full h-11 rounded-2xl shadow-premium hover:shadow-premium-hover flex items-center justify-center gap-2 group transition-all"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                      ) : (
                        <>
                          <span className="font-black uppercase tracking-widest text-xs">
                            Continue to dashboard
                          </span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Footer Links */}
                <div className="space-y-3 text-center">
                  <p className="text-xs font-medium text-gray-400">
                    Need help?{" "}
                    <Link
                      href="/support"
                      className="font-black text-taja-primary hover:underline underline-offset-4 uppercase"
                    >
                      Contact Support
                    </Link>
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-taja-primary transition-all underline"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Promo Panel */}
        <div className="relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
          <div className="absolute inset-0 motif-blanc opacity-60"></div>
          <div className="relative w-full max-w-sm space-y-8">
            <div className="space-y-4 mb-12 text-center lg:text-left pt-20">
              <h3 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">
                One Step<br />
                <span className="text-transparent bg-clip-text bg-gradient-taja">Away.</span>
              </h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: "Secure Verification",
                  desc: "We use encrypted one-time codes to keep your account safe.",
                  icon: ShieldCheck,
                },
                {
                  title: "Instant Access",
                  desc: "Start shopping and exploring the moment you verify.",
                  icon: Sparkles,
                },
                {
                  title: "Always Protected",
                  desc: "Your data is encrypted end-to-end on our platform.",
                  icon: Lock,
                },
                {
                  title: "24/7 Support",
                  desc: "We're here to help whenever you need us.",
                  icon: LifeBuoy,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card p-4 rounded-2xl border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-all"
                >
                  <div className="h-9 w-9 rounded-xl bg-taja-light flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-taja-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-taja-secondary tracking-tight">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-8 flex flex-col items-center lg:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 shadow-sm overflow-hidden">
                    <img src="https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/dele_mup0gl.png" alt="User" className="h-full w-full object-cover" />
                  </div>
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 shadow-sm overflow-hidden">
                    <img src="https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/LYNNPINNEDIT___mv5yne.jpg" alt="User" className="h-full w-full object-cover" />
                  </div>
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 shadow-sm overflow-hidden">
                    <img src="https://res.cloudinary.com/db2fcni0k/image/upload/v1771796366/Portrait____Cooperate_headshot_qfzmsr.jpg" alt="User" className="h-full w-full object-cover" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Trusted by Nigerians
                </p>
              </div>
              <div className="inline-flex items-center rounded-full bg-taja-light/30 px-4 py-2 border border-taja-primary/5">
                <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">
                  Presented by Antigravity Elite
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taja-primary"></div>
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
