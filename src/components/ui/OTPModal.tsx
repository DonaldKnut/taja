"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ShieldCheck, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend?: () => Promise<void>;
  email?: string;
  title?: string;
  description?: string;
}

export function OTPModal({
  isOpen,
  onClose,
  onVerify,
  onResend,
  email,
  title = "Verify your email",
  description = "Enter the 6-digit code we sent to your email address.",
}: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError(null);
      setTimer(60);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newOtp.every(digit => digit !== "") && index === 5) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      await onVerify(code);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      if (onResend) await onResend();
      setTimer(60);
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] p-8 md:p-10 overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight italic mb-2">{title}</h2>
              <p className="text-sm font-medium text-slate-500 max-w-xs leading-relaxed mb-10">
                {description} {email && <span className="text-slate-900 font-bold block mt-1">{email}</span>}
              </p>

              <div className="flex gap-2 sm:gap-3 mb-8" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={cn(
                      "w-10 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl border-2 transition-all",
                      digit 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900" 
                        : "border-slate-100 bg-slate-50 text-slate-900 focus:border-emerald-200 focus:bg-white"
                    )}
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-bold text-rose-500 mb-6 uppercase tracking-widest"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={() => handleVerify(otp.join(""))}
                disabled={loading || otp.some(d => d === "")}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-900/10 mb-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Verify Code <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Didn't receive it?</p>
                <button
                  onClick={handleResend}
                  disabled={timer > 0 || resending}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2",
                    timer > 0 
                      ? "text-slate-300 cursor-not-allowed" 
                      : "text-emerald-600 hover:text-emerald-700"
                  )}
                >
                  {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  {timer > 0 ? `Resend in ${timer}s` : "Resend Now"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
