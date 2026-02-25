"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, LifeBuoy, Rocket, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { z } from "zod";
import dynamic from "next/dynamic";
import { normalizeNigerianPhone, isValidNigerianPhone } from "@/lib/utils";
import { getAuthErrorMessage } from "@/lib/auth-messages";

// Dynamically import OAuth button (client-only)
const GoogleOAuthButton = dynamic(
  () => import("@/components/auth/OAuthButtons").then((mod) => ({ default: mod.GoogleOAuthButton })),
  { ssr: false, loading: () => <div className="h-10 bg-gray-100 animate-pulse rounded" /> }
);

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const registerSchema = z.object({
    fullName: z.string().min(2, { message: "Enter your full name" }),
    email: z.string().email({ message: "Enter a valid email" }),
    phone: z.string().min(1, { message: "Phone number is required" }).refine((val) => isValidNigerianPhone(val), { message: "Enter a valid Nigerian phone" }),
    password: z.string().regex(passwordRegex, { message: "Min 8 chars with uppercase, lowercase, number and special character" }),
    confirmPassword: z.string(),
    role: z.enum(["buyer", "seller"]),
    agreeToTerms: z.literal(true, { errorMap: () => ({ message: "Please agree to the terms" }) }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = (issue.path[0] as string) || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0] || "Please fix the errors");
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const normalizedPhone = normalizeNigerianPhone(formData.phone);
      const referralCode = searchParams.get("ref") || undefined;
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: normalizedPhone,
        password: formData.password,
        role: formData.role as "buyer" | "seller",
        referralCode: referralCode || undefined,
      });
      toast.success("Account created! Check your email to verify.");
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      console.error("Registration error:", error);
      const message = error?.message || "Registration failed. Please try again.";
      toast.error(getAuthErrorMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      const next = { ...errors };
      delete next[e.target.name];
      setErrors(next);
    }
  };

  const isFormValid = registerSchema.safeParse(formData).success;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof typeof formData;
    if (name === "confirmPassword") {
      const parsed = registerSchema.safeParse(formData);
      if (!parsed.success) {
        const issue = parsed.error.issues.find((i) => i.path[0] === "confirmPassword");
        if (issue) {
          setErrors((prev) => ({ ...prev, confirmPassword: issue.message }));
        } else {
          setErrors((prev) => { const next = { ...prev }; delete next.confirmPassword; return next; });
        }
      } else {
        setErrors((prev) => { const next = { ...prev }; delete next.confirmPassword; return next; });
      }
      return;
    }
    const baseSchema: any = (registerSchema as any)._def?.schema ?? registerSchema;
    const singleShape: any = { [name]: (baseSchema.shape as any)[name] };
    const single = z.object(singleShape);
    const parsed = single.safeParse({ [name]: (formData as any)[name] });
    if (!parsed.success) {
      setErrors((prev) => ({ ...prev, [name as string]: parsed.error.issues[0]?.message }));
    } else {
      setErrors((prev) => { const next = { ...prev }; delete next[name as string]; return next; });
    }
  };

  // Password requirements for visual feedback
  const pwChecks = [
    { label: "8+ characters", met: formData.password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(formData.password) },
    { label: "Lowercase letter", met: /[a-z]/.test(formData.password) },
    { label: "Number", met: /\d/.test(formData.password) },
    { label: "Special character (!@#$%...)", met: /[@$!%*?&]/.test(formData.password) },
  ];

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
    if (errors[e.target.name]) {
      const next = { ...errors };
      delete next[e.target.name];
      setErrors(next);
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
          <div className="w-full max-w-lg glass-card rounded-[2rem] border-white/40 shadow-premium max-h-full overflow-hidden flex flex-col">
            <div className="p-8 sm:p-10 overflow-y-auto scrollbar-hide flex-1">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                    <Logo size="lg" variant="header" />
                  </div>
                  <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">Expand Your Reach</h2>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Join the Elite Nigerian Marketplace</p>
                </div>

                <div className="space-y-6">
                  <GoogleOAuthButton source="register_page" redirect="/dashboard" className="w-full" />
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span>Premium Registration</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Full Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" /></div>
                          <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleChange} onBlur={handleBlur} className={`pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${errors.fullName ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="John Doe" />
                        </div>
                        {errors.fullName && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.fullName}</p>}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Email</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" /></div>
                          <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${errors.email ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="john@example.com" />
                        </div>
                        {errors.email && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Phone Number</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" /></div>
                          <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} onBlur={handleBlur} className={`pl-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${errors.phone ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="08012345678" />
                        </div>
                        {errors.phone && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <label htmlFor="role" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">I want to</label>
                        <div className="relative group">
                          <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full pl-4 pr-10 bg-white/50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-taja-primary/20 rounded-2xl h-11 transition-all appearance-none text-sm font-medium">
                            <option value="buyer">Buy premium products</option>
                            <option value="seller">Sell as an elite merchant</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><ArrowRight className="h-4 w-4 text-gray-400 rotate-90" /></div>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" /></div>
                          <Input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} onBlur={handleBlur} className={`pl-12 pr-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${errors.password ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="••••••••" />
                          <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                        {formData.password.length > 0 && (
                          <div className="mt-2 ml-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                            {pwChecks.map((c) => (
                              <p key={c.label} className={`text-[9px] font-semibold flex items-center gap-1 ${c.met ? 'text-taja-primary' : 'text-gray-300'}`}>
                                <span className={`inline-block h-1 w-1 rounded-full ${c.met ? 'bg-taja-primary' : 'bg-gray-300'}`} />
                                {c.label}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-[10px] font-black text-taja-secondary uppercase tracking-widest ml-1 mb-1.5">Confirm Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400 group-focus-within:text-taja-primary transition-colors" /></div>
                          <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} className={`pl-12 pr-12 bg-white/50 border-gray-100 focus:bg-white focus:ring-taja-primary/20 rounded-2xl h-11 transition-all ${errors.confirmPassword ? 'border-red-300 focus:ring-red-200' : ''}`} placeholder="••••••••" />
                          <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                        {errors.confirmPassword && <p className="text-[10px] text-red-500 font-medium mt-1 ml-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>

                    <div className="flex items-start gap-3 px-1">
                      <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleCheckboxChange} className="mt-0.5 h-4 w-4 text-taja-primary focus:ring-taja-primary border-gray-200 rounded cursor-pointer" />
                      <label htmlFor="agreeToTerms" className="text-[10px] font-bold text-gray-500 leading-tight uppercase tracking-wider">I agree to the <Link href="/terms" className="text-taja-primary hover:underline">Terms of Service</Link>, <Link href="/privacy" className="text-taja-primary hover:underline">Privacy Policy</Link> and receiving <span className="text-taja-primary">newsletters</span></label>
                    </div>

                    <Button type="submit" disabled={loading || !isFormValid} className="w-full h-11 rounded-2xl shadow-premium hover:shadow-premium-hover flex items-center justify-center gap-2 group transition-all">
                      {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <><span className="font-black uppercase tracking-widest text-xs">Create Free Account</span><ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                  </form>

                  <div className="pt-2 text-center">
                    <p className="text-xs font-medium text-gray-400">Already a member? <Link href="/login" className="font-black text-taja-primary hover:underline underline-offset-4 transition-all uppercase">Sign In</Link></p>
                    <Link href="/" className="mt-6 inline-flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-taja-primary transition-all underline shrink-0">Back to Marketplace</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
          <div className="absolute inset-0 motif-blanc opacity-60"></div>
          <div className="relative w-full max-w-sm space-y-8">
            <div className="space-y-4 mb-12 text-center lg:text-left pt-20">
              <h3 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">Begin Your <br /><span className="text-transparent bg-clip-text bg-gradient-taja">Success Story.</span></h3>
            </div>
            <div className="space-y-4">
              {[
                { title: "Rapid Onboarding", desc: "Get your store live in under 5 minutes.", icon: Rocket },
                { title: "Escrow Included", desc: "Never worry about payment trust again.", icon: Shield },
                { title: "Direct Support", desc: "24/7 dedicated help for account growth.", icon: LifeBuoy },
                { title: "Vibrant Community", desc: "Connect with Nigeria's best sellers.", icon: Users },
              ].map((item, i) => (
                <div key={i} className="glass-card p-4 rounded-2xl border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-all">
                  <div className="h-9 w-9 rounded-xl bg-taja-light flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-taja-primary" /></div>
                  <div>
                    <p className="text-sm font-black text-taja-secondary tracking-tight">{item.title}</p>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight">{item.desc}</p>
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
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Trusted by Nigerians</p>
              </div>
              <div className="inline-flex items-center rounded-full bg-taja-light/30 px-4 py-2 border border-taja-primary/5">
                <span className="text-[10px] font-black text-taja-primary uppercase tracking-widest">Presented by Antigravity Elite</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taja-primary"></div></div>}>
      <RegisterForm />
    </Suspense>
  );
}
