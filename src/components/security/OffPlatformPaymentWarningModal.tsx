"use client";

import { ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface OffPlatformPaymentWarningModalProps {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export function OffPlatformPaymentWarningModal({
  open,
  onContinue,
  onCancel,
}: OffPlatformPaymentWarningModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed inset-x-4 bottom-8 z-[201] mx-auto max-w-md rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] border border-slate-100 overflow-hidden"
          >
            <div className="px-5 pt-4 pb-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Stay Protected on Taja
                    </h3>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      aria-label="Close warning"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                    Always make payments <span className="font-semibold text-slate-900">inside Taja</span>.
                    Any payment made via WhatsApp, bank transfer, or outside the platform{" "}
                    <span className="font-semibold text-slate-900">cannot be tracked or protected by Taja</span>.
                    If you pay off‑platform and the seller does not deliver, Taja is{" "}
                    <span className="font-semibold text-slate-900">not liable</span>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500"
                  onClick={onCancel}
                >
                  Stay on Taja
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.22em] shadow-md"
                  onClick={onContinue}
                >
                  Continue to WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

