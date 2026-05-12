"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("taja_cookie_consent");
    if (!hasConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("taja_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("taja_cookie_consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className={cn(
            "fixed z-[10050] pointer-events-none",
            "left-3 right-3 sm:left-4 sm:right-4",
            "md:left-auto md:right-6 md:max-w-xl md:w-[min(36rem,calc(100vw-3rem))]",
            "bottom-[max(1rem,calc(0.75rem+env(safe-area-inset-bottom)+var(--mobile-bottom-nav-height,0px)))]"
          )}
        >
          <div
            className={cn(
              "pointer-events-auto rounded-2xl sm:rounded-[1.75rem] border border-slate-200/95 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.28)]",
              "bg-white/95 backdrop-blur-md",
              "p-4 sm:p-6 overflow-hidden relative"
            )}
          >
            <div className="absolute -top-16 -right-10 w-40 h-40 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-slate-300/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
              <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm mx-auto md:mx-0">
                <Cookie className="h-7 w-7 text-emerald-700" aria-hidden />
              </div>

              <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:justify-start md:gap-3">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Cookies &amp; your experience
                  </h3>
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="hidden sm:flex p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors self-end md:self-start"
                    aria-label="Dismiss cookie notice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  We use cookies to run checkout, remember preferences, measure traffic, and improve Taja. By accepting,
                  you agree to our use of cookies as described in the privacy policy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2 shrink-0 w-full md:w-auto md:min-w-[10.5rem]">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="sm:hidden text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 py-2"
                >
                  Decline
                </button>
                <Button
                  onClick={handleAccept}
                  className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl px-6 shadow-premium hover:shadow-premium-hover flex items-center justify-center gap-2"
                >
                  <span className="font-black uppercase tracking-widest text-[10px]">Accept</span>
                  <Zap className="h-3.5 w-3.5 fill-white shrink-0" aria-hidden />
                </Button>
                <button
                  type="button"
                  onClick={handleDecline}
                  className="hidden sm:block text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 py-1"
                >
                  Decline
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-4 border-t border-slate-200/90 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Privacy first</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
                <a
                  href="/privacy"
                  className="text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:underline underline-offset-4"
                >
                  Privacy policy
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
