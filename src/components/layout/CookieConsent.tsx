"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/dismissed
    const hasConsent = localStorage.getItem("taja_cookie_consent");
    if (!hasConsent) {
      // Delay showing the modal for a smoother experience
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
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl"
        >
          <div className="glass-card rounded-[2rem] border-white/40 shadow-2xl p-5 sm:p-8 overflow-hidden relative group">
            {/* Decorative background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-taja-primary/10 rounded-full blur-2xl group-hover:bg-taja-primary/20 transition-all duration-700"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              {/* Icon / Visual Side */}
              <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                <Cookie className="h-8 w-8 text-emerald-600 relative z-10" />
              </div>

              {/* Content Side */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight italic">Premium Experience.</h3>
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                    Safe & Secure
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed max-w-md">
                  We use cookies to curate a personalized shopping experience, analyze site traffic, and power our premium features. By accepting, you join our elite marketplace ecosystem.
                </p>
              </div>

              {/* Action Side */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleDecline}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors px-4"
                >
                  Decline
                </button>
                <Button
                  onClick={handleAccept}
                  className="w-full sm:w-auto h-12 rounded-2xl px-8 shadow-premium hover:shadow-premium-hover flex items-center justify-center gap-2 group transition-all"
                >
                  <span className="font-black uppercase tracking-widest text-[10px]">Accept All</span>
                  <Zap className="h-3.5 w-3.5 fill-white group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Subtle progress bar or separator could go here, but keeping it clean is better */}
            <div className="mt-4 pt-4 border-t border-slate-100/50 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Privacy Protected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-emerald-500" />
                <Link href="/privacy" className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline underline-offset-4">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Internal Link component to avoid import issues if not needed elsewhere
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
