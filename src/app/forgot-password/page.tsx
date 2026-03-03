"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Zap,
  Smartphone,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailWasActuallySent, setEmailWasActuallySent] = useState<
    boolean | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isOAuthAccount, setIsOAuthAccount] = useState(false);
  const [oauthHint, setOauthHint] = useState<string | null>(null);

  const forgotSchema = z.object({
    email: z.string().email({ message: "Enter a valid email" }),
  });

  const isFormValid = forgotSchema.safeParse({ email }).success;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message || "Please enter a valid email";
      setError(msg);
      toast.error(msg);
      return;
    }
    setError(null);
    setLoading(true);
    setIsOAuthAccount(false);
    setOauthHint(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if this is an OAuth-only account
        if (data.oauthAccount) {
          setIsOAuthAccount(true);
          setOauthHint(data.hint || null);
          setEmailSent(true);
          toast.error(
            "This account uses social sign-in. Please use 'Sign in with Google'.",
          );
        } else {
          setEmailSent(true);
          setEmailWasActuallySent(data._emailSent);

          if (data._emailSent) {
            toast.success("Password reset link sent to your email!");
          } else {
            toast.success("If an account exists, a reset link has been sent.");
          }
        }
      } else {
        toast.error(data.message || "Failed to send reset link");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Left Panel: Form Section */}
        <div className="relative bg-white p-6 sm:p-10 flex flex-col items-center justify-center overflow-hidden">
          {/* Cinematic Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="motif-blanc absolute inset-0 opacity-40" />
            <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-taja-primary/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-taja-primary/10 rounded-full blur-[120px]" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative z-10 w-full max-w-md space-y-10"
          >
            {/* Logo Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center text-center"
            >
              <Logo size="lg" className="mb-8" href="/" />
            </motion.div>

            <AnimatePresence mode="wait">
              {!emailSent ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-taja-secondary tracking-tighter mb-3">
                      Restore <span className="text-taja-primary">Access</span>
                    </h2>
                    <p className="text-sm font-medium text-gray-500 tracking-wide">
                      Locked out? Enter your credentials for recovery.
                    </p>
                  </div>

                  <div className="glass-card p-10 border-white/60 bg-white/20 backdrop-blur-xl space-y-8 shadow-2xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-[10px] font-black text-taja-primary uppercase tracking-[0.2em] ml-1"
                        >
                          Recovery Email
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-taja-primary transition-colors text-gray-400">
                            <Mail className="h-4 w-4" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (error) setError(null);
                            }}
                            className="pl-12 py-6 bg-white/30 backdrop-blur-md border border-white/40 focus:bg-white/50 focus:border-taja-primary/40 focus:ring-taja-primary/10 rounded-2xl shadow-inner text-sm font-bold transition-all"
                            placeholder="agent@taja.shop"
                          />
                        </div>
                        {error && (
                          <p className="text-[10px] font-bold text-red-500 ml-1">
                            {error}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !isFormValid}
                        className="w-full py-7 bg-taja-primary hover:bg-taja-primary/90 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-emerald transition-all duration-300 transform active:scale-[0.98] border border-white/20"
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>Routing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>Request Recovery</span>
                            <Zap className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    </form>

                    <div className="pt-4 text-center">
                      <Link
                        href="/login"
                        className="text-[10px] font-black text-taja-primary hover:text-taja-primary/80 uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-transform hover:-translate-x-1"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Return to Hub
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8"
                >
                  {isOAuthAccount ? (
                    <>
                      {/* OAuth Account Notice */}
                      <div className="mx-auto w-24 h-24 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                        <ShieldCheck className="h-10 w-10 text-blue-600 relative z-10" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">
                          Social Sign-In{" "}
                          <span className="text-blue-600">Account</span>
                        </h2>
                        <p className="text-sm font-medium text-gray-600 tracking-wide leading-relaxed">
                          This account is linked to <br />
                          <span className="text-taja-secondary font-black">
                            {email}
                          </span>
                        </p>
                      </div>

                      <div className="glass-card p-8 border-white/60 bg-blue-50/50 backdrop-blur-xl space-y-6 shadow-2xl">
                        <div className="bg-white/80 rounded-xl p-6 space-y-4">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700 font-medium text-left">
                              {oauthHint ||
                                'This account uses social sign-in. Please use "Sign in with Google" to access your account.'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Link href="/login">
                            <Button className="w-full py-6 bg-taja-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-taja-primary/90 transition-all border border-white/10">
                              Sign In with Google
                            </Button>
                          </Link>

                          <button
                            onClick={() => setEmailSent(false)}
                            className="w-full text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.2em] transition-colors"
                          >
                            Try Another Email
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Regular Success State */}
                      <div className="mx-auto w-24 h-24 rounded-3xl bg-taja-primary/10 border border-taja-primary/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-taja-primary/20 blur-2xl rounded-full" />
                        <Sparkles className="h-10 w-10 text-taja-primary relative z-10" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-3xl font-black text-taja-secondary tracking-tighter">
                          Check Your{" "}
                          <span className="text-taja-primary">Email</span>
                        </h2>
                        <p className="text-sm font-medium text-gray-500 tracking-wide leading-relaxed">
                          {emailWasActuallySent ? (
                            <>
                              We've sent a reset link to <br />
                              <span className="text-taja-secondary font-black">
                                {email}
                              </span>
                            </>
                          ) : (
                            <>
                              If an account exists with <br />
                              <span className="text-taja-secondary font-black">
                                {email}
                              </span>
                              <br />
                              you will receive a reset link.
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="glass-card p-8 border-white/60 bg-white/20 backdrop-blur-xl space-y-4 shadow-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                      Communication not received? <br />
                      Verify your spam protocols or{" "}
                      <button
                        onClick={() => setEmailSent(false)}
                        className="text-taja-primary font-black hover:underline"
                      >
                        re-initialize.
                      </button>
                    </p>

                    <Link href="/login">
                      <Button className="w-full mt-6 py-6 bg-taja-secondary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-taja-secondary/90 transition-all border border-white/10">
                        Back to Authentication
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Support Section */}
            <motion.div
              variants={itemVariants}
              className="pt-8 border-t border-gray-100"
            >
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                <Link
                  href="/"
                  className="hover:text-taja-primary transition-colors"
                >
                  Home
                </Link>
                <div className="h-1 w-1 rounded-full bg-gray-200" />
                <Link
                  href="/contact"
                  className="hover:text-taja-primary transition-colors"
                >
                  Support
                </Link>
                <div className="h-1 w-1 rounded-full bg-gray-200" />
                <Link
                  href="/help"
                  className="hover:text-taja-primary transition-colors"
                >
                  Help Center
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Panel: Informational Section */}
        <div className="hidden md:flex relative flex-col items-center justify-center p-12 overflow-hidden bg-white border-l border-gray-50">
          <div className="absolute inset-0 motif-blanc opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-emerald-50/50 via-transparent to-transparent pointer-events-none rotate-12" />

          <div className="relative z-10 w-full max-w-sm space-y-12">
            <div className="space-y-4 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <h3 className="text-4xl font-black text-taja-secondary tracking-tighter leading-none">
                  Account Recovery <br />
                  <span className="text-transparent bg-clip-text bg-gradient-taja">
                    Made Simple.
                  </span>
                </h3>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-gray-400 font-medium leading-relaxed"
              >
                We'll help you get back to your shop in no time. Your security
                is our top priority, but the process shouldn't be a headache.
              </motion.p>
            </div>

            {/* Recovery Features Grid */}
            <div className="space-y-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Smart Validation",
                  desc: "Proving it's you, without the friction.",
                },
                {
                  icon: Zap,
                  title: "Instant Sync",
                  desc: "Get back to selling immediately once verified.",
                },
                {
                  icon: Smartphone,
                  title: "Recognized Hubs",
                  desc: "We remember your trusted, verified devices.",
                },
                {
                  icon: Sparkles,
                  title: "Neural Lock",
                  desc: "AI-monitored recovery for elite security.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="glass-card p-5 rounded-2xl border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-taja-light flex items-center justify-center shrink-0">
                    <feature.icon className="h-5 w-5 text-taja-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-taja-secondary tracking-tight mb-0.5">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Support Link */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <Link href="/help">
                <div className="glass-card bg-white/50 border-gray-100 p-6 flex items-center justify-between group hover:border-taja-primary/40 transition-all duration-500 rounded-[2rem]">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-taja-primary/10 flex items-center justify-center text-taja-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-taja-secondary uppercase tracking-widest">
                        Still restricted?
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Connect with our security task force.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-taja-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          </div>

          <div className="absolute bottom-8 left-12 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 shadow-sm overflow-hidden"
                >
                  <img
                    src={`https://i.pravatar.cc/100?img=${n + 25}`}
                    alt="User"
                    className="h-full w-full object-cover opacity-80"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Securing Top Shops
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
