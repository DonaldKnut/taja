"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Truck, Activity, ShoppingBag, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { getAuthErrorMessage } from "@/lib/auth-messages";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";

// Dynamically import OAuth button (client-only)
const GoogleOAuthButton = dynamic(
  () => import("@/components/auth/OAuthButtons").then((mod) => ({ default: mod.GoogleOAuthButton })),
  { ssr: false, loading: () => <div className="h-10 bg-gray-100 animate-pulse rounded" /> }
);

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Detect if user was redirected from checkout flow
  const redirectParam = searchParams.get("redirect") || "";
  const isCheckoutContext = redirectParam.includes("/checkout");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      const token = localStorage.getItem("token");
      if (token) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("error") || urlParams.get("clear")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
        } else {
          // If a token exists and we aren't clearing it, immediately redirect
          const role = localStorage.getItem("role");
          router.replace(role === "seller" ? "/seller/dashboard" : "/dashboard");
        }
      }
    }
  }, []);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const email = searchParams.get("email");
    if (verified === "true" && email) {
      toast.success("Email verified successfully! Please sign in to continue.");
      setFormData((prev) => ({ ...prev, email: decodeURIComponent(email) }));
    }
  }, [searchParams]);

  // Show a beautiful toast for any error passed in URL (e.g. from OAuth redirect)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(getAuthErrorMessage(error));
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [searchParams]);

  const loginSchema = z.object({
    email: z.string().email({ message: "Enter a valid email" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  });

  const isFormValid = loginSchema.safeParse(formData).success;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target as { name: "email" | "password" };
    const single = loginSchema.pick({ [name]: true } as any);
    const parsed = single.safeParse({ [name]: formData[name] } as any);
    if (!parsed.success) {
      setErrors({ ...errors, [name]: parsed.error.issues[0]?.message });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = loginSchema.safeParse(formData);
    if (!parse.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      parse.error.issues.forEach((issue) => {
        const path = issue.path[0] as "email" | "password";
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] || "Please fix the errors");
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await authLogin(formData.email, formData.password, rememberMe);
      toast.success("Welcome back!");
      if (typeof window !== "undefined") {
        localStorage.setItem("rememberMe", rememberMe.toString());
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      await new Promise(resolve => setTimeout(resolve, 100));

      // Determine final redirect path
      const userRole = localStorage.getItem("role");
      let redirect = searchParams.get("redirect") || "";

      // Clean up the redirect path
      if (redirect) {
        redirect = decodeURIComponent(redirect);
        // Ensure it starts with / and doesn't contain external URLs for security
        if (!redirect.startsWith("/")) redirect = "/" + redirect;
        // Strip out any redundant /auth prefixes if they were mistakenly added
        if (redirect.startsWith("/auth/")) {
          redirect = redirect.replace("/auth/", "/");
        }
      }

      if (!redirect || redirect === "/" || redirect === "/dashboard" || redirect === "/seller/dashboard") {
        redirect = userRole === "seller" ? "/seller/dashboard" : "/dashboard";
      }

      router.push(redirect);
    } catch (error: any) {
      const message = error?.message || "Login failed. Please check your credentials.";
      toast.error(getAuthErrorMessage(message));
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as "email" | "password"]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  return (
    <div className="h-screen bg-white overflow-hidden md:h-[100dvh] relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 motif-blanc opacity-40"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-taja-primary/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-taja-primary/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="grid h-full grid-cols-1 md:grid-cols-2 relative z-10">
        <div className="flex items-center justify-center p-4 sm:p-8 md:p-12 h-full overflow-hidden">
          <div className="w-full max-w-md glass-card rounded-[2rem] border-white/40 shadow-premium max-h-full overflow-hidden flex flex-col">
            <div className="p-8 sm:p-10 overflow-y-auto scrollbar-hide space-y-8 flex-1">
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-6">
                  <Logo size="lg" variant="header" />
                </div>
                {isCheckoutContext ? (
                  <>
                    <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-taja-primary/10 border border-taja-primary/20">
                      <ShoppingBag className="h-3.5 w-3.5 text-taja-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Almost there!</span>
                    </div>
                    <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">
                      One step to complete<br />your order
                    </h2>
                    <p className="text-sm font-medium text-gray-400">
                      Sign in or create a free account to complete your purchase.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-black text-taja-secondary tracking-tighter">
                      Welcome back
                    </h2>
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                      Sign in to your premium shop
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <GoogleOAuthButton
                  source="login_page"
                  redirect={searchParams.get("redirect") || "/dashboard"}
                  className="w-full"
                />

                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span>Secure Login</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Email address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                        </div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-12 transition-all"
                          placeholder="name@example.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" />
                        </div>
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="pl-12 pr-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-12 transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-taja-primary transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.password}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-taja-primary focus:ring-taja-primary border-gray-200 rounded cursor-pointer transition-all"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-gray-500 cursor-pointer">Remember Me</label>
                    </div>
                    <Link href="/forgot-password" className="text-xs font-bold text-taja-primary hover:text-taja-secondary transition-colors">Forgot Password?</Link>
                  </div>

                  <Button type="submit" disabled={loading || !isFormValid} className="w-full h-12 rounded-2xl shadow-premium hover:shadow-premium-hover flex items-center justify-center gap-2 group transition-all">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    ) : (
                      <>
                        <span className="font-black uppercase tracking-widest text-xs">Sign In</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="pt-4 text-center space-y-3">
                  {isCheckoutContext ? (
                    <>
                      <p className="text-xs font-medium text-gray-400">
                        New to Taja?{" "}
                        <Link
                          href={`/register?redirect=${encodeURIComponent(redirectParam)}`}
                          className="font-black text-taja-primary hover:underline underline-offset-4 transition-all"
                        >
                          Create a free account →
                        </Link>
                      </p>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        Your cart is saved and waiting
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-medium text-gray-400">
                      Don&apos;t have an account?{" "}
                      <Link href="/register" className="font-black text-taja-primary hover:underline underline-offset-4 transition-all">START SELLING FREE</Link>
                    </p>
                  )}
                  <Link href="/" className="mt-2 inline-flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-taja-primary transition-all">
                    <ArrowRight className="h-3 w-3 rotate-180" /> Back to Hub
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
          <div className="absolute inset-0 motif-blanc opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-50/50 via-transparent to-transparent pointer-events-none rotate-12" />
          <div className="relative w-full max-w-sm space-y-6">
            {isCheckoutContext ? (
              <>
                <div className="space-y-4 mb-12 text-center lg:text-left pt-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-taja-primary/10 border border-taja-primary/20 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-taja-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-taja-primary">Buyer Protected</span>
                  </div>
                  <h3 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">
                    Your order is<br />
                    <span className="text-transparent bg-clip-text bg-gradient-taja">safe with us.</span>
                  </h3>
                  <p className="text-gray-400 font-medium">Create your free account in under 60 seconds and complete your purchase securely.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Escrow Protection", desc: "Funds held securely until you confirm delivery.", icon: ShieldCheck },
                    { title: "Fast Lagos Delivery", desc: "Same-day and next-day delivery zones available.", icon: Zap },
                    { title: "Easy Returns", desc: "Hassle-free buyer protection on every order.", icon: ShoppingBag },
                  ].map((item, i) => (
                    <div key={i} className="glass-card p-5 rounded-2xl border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-all">
                      <div className="h-10 w-10 rounded-xl bg-taja-light flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-taja-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-taja-secondary tracking-tight">{item.title}</p>
                        <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-12 text-center lg:text-left pt-20">
                  <h3 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">
                    Elite Commerce <br />
                    <span className="text-transparent bg-clip-text bg-gradient-taja">Perfected.</span>
                  </h3>
                  <p className="text-gray-400 font-medium">Join top Nigerian sellers setting the new standard and get our newsletters.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Escrow Protection", desc: "Bank-level security for every transaction.", icon: Shield },
                    { title: "Smart Logistics", desc: "Unified shipping across all major cities.", icon: Truck },
                    { title: "Premium Tools", desc: "Advanced analytics for modern growth.", icon: Activity },
                  ].map((item, i) => (
                    <div key={i} className="glass-card p-5 rounded-2xl border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-all">
                      <div className="h-10 w-10 rounded-xl bg-taja-light flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-taja-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-taja-secondary tracking-tight">{item.title}</p>
                        <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="absolute bottom-8 left-12 flex items-center gap-3">
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
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Trusted by Nigerians</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taja-primary"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}
