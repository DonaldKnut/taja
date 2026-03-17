"use client";

import { AlertTriangle, Check, Shield, X } from "lucide-react";

interface ChatSecurityWarningModalProps {
  isOpen: boolean;
  warningType: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChatSecurityWarningModal({
  isOpen,
  warningType,
  onCancel,
  onConfirm,
}: ChatSecurityWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-taja-secondary mb-1">Security Alert</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your message contains what appears to be{" "}
              <span className="font-bold text-amber-600">{warningType}</span>.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-2">Important Security Notice:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Always pay through the Taja platform for buyer protection</li>
                <li>Never share account numbers or make direct transfers</li>
                <li>Escrow ensures your money is safe until delivery</li>
                <li>Off-platform payments are not protected</li>
                <li>You could lose your money with no recourse</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <X className="h-4 w-4" />
              Edit Message
            </span>
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-taja-primary text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              Send Anyway
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
