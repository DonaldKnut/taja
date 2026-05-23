"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
// Analytics tracking - disabled temporarily to fix webpack loading issues
const trackEvent = (event: { name: string; properties?: Record<string, any> }) => {
  // No-op for now to avoid webpack loading issues
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics] Event:", event.name, event.properties);
  }
};
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Mail, UserPlus, X } from "lucide-react";
import { GoogleOAuthButton } from "@/components/auth/OAuthButtons";
import { toast } from "react-hot-toast";

interface AuthEntryModalProps {
  open: boolean;
  onClose: () => void;
  source?: string;
}

// Use internal API routes

export function AuthEntryModal({ open, onClose, source = "marketplace" }: AuthEntryModalProps) {
  const router = useRouter();
  const labelId = useId();
  const descriptionId = useId();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      trackEvent({
        name: "auth_modal_open",
        properties: { source },
      });
    }
  }, [open, source]);

  if (!open || isAuthenticated) {
    return null;
  }

  const redirectUrl =
    typeof window !== "undefined" ? encodeURIComponent(window.location.pathname + window.location.search) : "";


  const handleEmail = () => {
    trackEvent({
      name: "auth_modal_cta_click",
      properties: {
        provider: "email",
        source,
      },
    });
    // Redirect to login page
    router.push(`/login?redirect=${redirectUrl}`);
    onClose();
  };

  const handleSellerSignup = () => {
    trackEvent({
      name: "auth_modal_cta_click",
      properties: {
        provider: "seller_signup",
        source,
      },
    });
    router.push("/register?seller=1");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className={cn(
          "relative w-full max-w-lg rounded-3xl border border-gray-200 bg-white shadow-2xl",
          "animate-in fade-in zoom-in duration-200"
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close authentication prompt"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 pb-8 pt-10 text-center">
          <div className="mx-auto mb-4 inline-flex items-center justify-center rounded-full bg-emerald-100 p-3">
            <UserPlus className="h-5 w-5 text-emerald-600" />
          </div>
          <h2 id={labelId} className="text-2xl font-semibold text-gray-900">
            Join the Taja community
          </h2>
          <p id={descriptionId} className="mt-2 text-sm text-gray-600">
            Sign in to see personalised drops, saved filters and deals curated for you.
          </p>

          <div className="mt-6 space-y-3">
            <GoogleOAuthButton
              source={source}
              redirect={redirectUrl}
              className="h-12 rounded-xl"
            />

            <Button onClick={handleEmail} className="flex w-full items-center justify-center gap-3">
              <Mail className="h-4 w-4" />
              Continue with Email
            </Button>

            <Button
              onClick={handleSellerSignup}
              variant="outline"
              className="flex w-full items-center justify-center gap-3 border-gray-300 text-gray-900 hover:border-emerald-400 hover:text-emerald-700"
            >
              <UserPlus className="h-4 w-4" />
              Create a Seller Account
            </Button>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            By continuing you agree to our{" "}
            <Link href="/terms" className="text-emerald-600 underline hover:text-emerald-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-emerald-600 underline hover:text-emerald-700">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

